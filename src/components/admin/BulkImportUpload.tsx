import React, { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_COLUMNS = [
  "title",
  "type",
  "genre",
  "year",
  "rating",
  "poster url",
  "backdrop url",
  "videourl",
  "featured",
  "trending",
  "is_kids",
  "duration",
  "season_number",
  "episode_number",
  "episode_title",
  "episode_description",
  "episode_videourl",
  "episode_duration",
];

const parseBool = (val: any): boolean =>
  val === true || val === "TRUE" || val === "true";

const parseNum = (val: any): number | null => {
  const n = Number(val);
  return val !== null && val !== "" && !isNaN(n) ? n : null;
};

type Row = Record<string, any>;

const BulkImportUpload = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ── File parsing ──────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    const f = e.target.files?.[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert to array-of-arrays first so we can detect whether row 1
        // is a hint row or the actual header row.
        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        // If the first cell of row 0 does NOT match a known column name it is
        // a hint/note row — skip it and treat row 1 as the header row.
        const firstCellRow0 = String(raw[0]?.[0] ?? "").toLowerCase().trim();
        const isHintRow = !ALLOWED_COLUMNS.includes(firstCellRow0);
        const headerRowIndex = isHintRow ? 1 : 0;
        const headerRow: string[] = (raw[headerRowIndex] ?? []).map((h: any) =>
          String(h ?? "").trim()
        );
        const dataRows = raw.slice(headerRowIndex + 1);

        let parsed: Row[] = dataRows
          .filter((r) => r.some((cell) => cell !== null && cell !== ""))
          .map((r) => {
            const obj: Row = {};
            headerRow.forEach((key, i) => {
              obj[key] = r[i] ?? null;
            });
            return obj;
          });

        // Keep only known columns
        parsed = parsed.map((row) => {
          const filtered: Row = {};
          ALLOWED_COLUMNS.forEach((col) => {
            filtered[col] = row[col] ?? null;
          });
          return filtered;
        });

        setRows(parsed);
      } catch {
        setError("Failed to parse Excel file. Please use the provided template.");
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  // ── Import logic ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setError("");
    setSuccess("");
    if (!rows.length) return setError("No data to import.");
    setLoading(true);

    let successContent = 0;
    let failContent = 0;

    // Split rows by type
    const movieRows = rows.filter((r) => r.type === "movie");
    const seriesRows = rows.filter((r) => r.type === "series");

    // ── 1. Insert movies ────────────────────────────────────────────────────
    for (const row of movieRows) {
      const { error: err } = await supabase.from("content").insert([
        {
          title: row.title || null,
          type: "movie",
          genre: row.genre || null,
          year: parseNum(row.year),
          rating: parseNum(row.rating),
          poster_url: row["poster url"] || null,
          backdrop_url: row["backdrop url"] || null,
          video_url: row.videourl || null,
          duration_minutes: parseNum(row.duration),
          is_featured: parseBool(row.featured),
          is_trending: parseBool(row.trending),
          is_kids: parseBool(row.is_kids),
        },
      ]);

      if (err) {
        console.error("Movie insert error:", err);
        failContent++;
      } else {
        successContent++;
      }
    }

    // ── 2. Insert series (grouped by title) ─────────────────────────────────
    // Group all series rows by title
    const seriesMap = new Map<string, Row[]>();
    for (const row of seriesRows) {
      const title = (row.title || "").trim();
      if (!title) continue;
      if (!seriesMap.has(title)) seriesMap.set(title, []);
      seriesMap.get(title)!.push(row);
    }

    for (const [title, episodeRows] of seriesMap.entries()) {
      const sample = episodeRows[0]; // Use first row for series-level data

      // 2a. Insert content row for the series
      const { data: contentData, error: contentErr } = await supabase
        .from("content")
        .insert([
          {
            title,
            type: "series",
            genre: sample.genre || null,
            year: parseNum(sample.year),
            rating: parseNum(sample.rating),
            poster_url: sample["poster url"] || null,
            backdrop_url: sample["backdrop url"] || null,
            video_url: null,
            is_featured: parseBool(sample.featured),
            is_trending: parseBool(sample.trending),
            is_kids: parseBool(sample.is_kids),
          },
        ])
        .select("id")
        .single();

      if (contentErr || !contentData) {
        console.error("Series content insert error:", contentErr);
        failContent++;
        continue;
      }
      successContent++;

      const contentId = contentData.id;

      // 2b. Group episodes by season_number
      const seasonMap = new Map<number, Row[]>();
      for (const row of episodeRows) {
        const seasonNum = parseNum(row.season_number);
        if (seasonNum === null) continue;
        if (!seasonMap.has(seasonNum)) seasonMap.set(seasonNum, []);
        seasonMap.get(seasonNum)!.push(row);
      }

      for (const [seasonNumber, eps] of seasonMap.entries()) {
        // 2c. Insert season row
        const { data: seasonData, error: seasonErr } = await supabase
          .from("seasons")
          .insert([
            {
              content_id: contentId,
              season_number: seasonNumber,
              title: `Season ${seasonNumber}`,
            },
          ])
          .select("id")
          .single();

        if (seasonErr || !seasonData) {
          console.error("Season insert error:", seasonErr);
          continue;
        }

        const seasonId = seasonData.id;

        // 2d. Insert episodes for this season
        const episodeInserts = eps
          .filter((ep) => ep.episode_title)
          .map((ep) => ({
            season_id: seasonId,
            episode_number: parseNum(ep.episode_number) ?? 0,
            title: ep.episode_title || null,
            description: ep.episode_description || null,
            video_url: ep.episode_videourl || null,
            duration_minutes: parseNum(ep.episode_duration),
          }));

        if (episodeInserts.length) {
          const { error: epErr } = await supabase
            .from("episodes")
            .insert(episodeInserts);
          if (epErr) console.error("Episodes insert error:", epErr);
        }
      }
    }

    setLoading(false);
    setSuccess(
      `Import complete — ${successContent} content item(s) added.${
        failContent ? ` ${failContent} failed (check console).` : ""
      }`
    );
  };

  // ── Preview columns (split into two groups for readability) ───────────────
  const previewCols = [
    "title", "type", "genre", "year", "rating",
    "season_number", "episode_number", "episode_title",
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Bulk Import Content</h3>
      </div>

      {/* Rules reminder */}
      <div className="bg-gray-700 rounded p-3 mb-4 text-xs text-gray-300 space-y-1">
        <p className="font-semibold text-white text-sm mb-1">How to fill the template:</p>
        <p>🎬 <strong>Movies:</strong> Fill in <code>title, type=movie, duration, videourl</code> — leave season/episode columns empty.</p>
        <p>📺 <strong>Series:</strong> Repeat series info (title, genre, poster…) on <em>every episode row</em>. Fill in <code>season_number, episode_number, episode_title, episode_videourl</code>.</p>
        <p>✅ <code>featured</code>, <code>trending</code>, <code>is_kids</code> must be <strong>TRUE</strong> or <strong>FALSE</strong>.</p>
      </div>

      {/* File input */}
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="mb-4 block text-white text-sm"
      />

      {/* Feedback */}
      {error && <div className="text-red-400 mb-3 text-sm">{error}</div>}
      {success && <div className="text-green-400 mb-3 text-sm">{success}</div>}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mb-4">
          <div className="text-gray-300 text-sm mb-2">
            Preview ({rows.length} row{rows.length !== 1 ? "s" : ""} — showing first 5):
          </div>
          <div className="overflow-x-auto rounded border border-gray-700">
            <table className="min-w-full text-xs text-gray-200">
              <thead className="bg-gray-700">
                <tr>
                  {previewCols.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-800" : "bg-gray-750"}>
                    {previewCols.map((col) => (
                      <td key={col} className="px-3 py-1 border-t border-gray-700 whitespace-nowrap">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {rows.filter((r) => r.type === "movie").length} movie row(s) ·{" "}
            {[...new Set(rows.filter((r) => r.type === "series").map((r) => r.title))].length} unique series ·{" "}
            {rows.filter((r) => r.type === "series").length} episode row(s)
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleCreate}
        disabled={!rows.length || loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded font-medium text-sm transition-colors"
      >
        {loading ? "Importing…" : "Import"}
      </button>
    </div>
  );
};

export default BulkImportUpload;
