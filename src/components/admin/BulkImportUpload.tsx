import React, { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_COLUMNS = [
  "title",
  "description",
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
  "completion_threshold_seconds",  // movie-level: seconds before end to mark complete
  "channel_id",                    // assign content to a channel
  "season_number",
  "episode_number",
  "episode_title",
  "episode_description",
  "episode_videourl",
  "episode_duration",
  "episode_thumbnail_url",         // episode thumbnail image URL
  "episode_completion_threshold",  // per-episode completion offset in seconds
];

// ✅ Fix 1: handles Excel numeric TRUE (1/0), actual booleans, and all string variants
const parseBool = (val: any): boolean =>
  val === true || val === 1 || String(val).toUpperCase() === "TRUE";

// ✅ Fix 2: trim before Number() so whitespace-only strings don't coerce to 0
const parseNum = (val: any): number | null => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === "") return null;
  const n = Number(str);
  return isNaN(n) ? null : n;
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

        const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        if (!raw.length) {
          setError("The spreadsheet appears to be empty.");
          setRows([]);
          return;
        }

        // ✅ Fix 3: count how many cells in row 0 match known columns instead of
        // only checking cell 0. A real header row should match multiple columns.
        // A hint/note row will match none or very few.
        // Threshold of 2 avoids false positives from a single accidental match.
        const row0Matches = (raw[0] ?? []).filter((cell: any) =>
          ALLOWED_COLUMNS.includes(String(cell ?? "").toLowerCase().trim())
        ).length;

        const isHintRow = row0Matches < 2;
        const headerRowIndex = isHintRow ? 1 : 0;

        if (headerRowIndex >= raw.length) {
          setError("Could not detect a valid header row in the spreadsheet.");
          setRows([]);
          return;
        }

        // ✅ Normalize headers to lowercase so column matching is case-insensitive
        const headerRow: string[] = (raw[headerRowIndex] ?? []).map((h: any) =>
          String(h ?? "").toLowerCase().trim()
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

        if (!parsed.length) {
          setError("No data rows found after the header row.");
          setRows([]);
          return;
        }

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

    try {
      const movieRows = rows.filter((r) => String(r.type || "").toLowerCase().trim() === "movie");
      const seriesRows = rows.filter((r) => String(r.type || "").toLowerCase().trim() === "series");

      // ── 1. Insert movies ────────────────────────────────────────────────────
      for (const row of movieRows) {
        const { error: err } = await supabase.from("content").insert([
          {
            title: row.title || null,
            description: row.description || null,
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
            channel_id: row.channel_id || null,
            completion_threshold_seconds: parseNum(row.completion_threshold_seconds),
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
      const seriesMap = new Map<string, Row[]>();
      for (const row of seriesRows) {
        const titleKey = (row.title || "").trim().toLowerCase();
        if (!titleKey) continue;
        if (!seriesMap.has(titleKey)) seriesMap.set(titleKey, []);
        seriesMap.get(titleKey)!.push(row);
      }

      for (const [, episodeRows] of seriesMap.entries()) {
        const sample = episodeRows[0];
        const title = (sample.title || "").trim();

        // Group episodes by season upfront so we can set counts at insert time
        const seasonMap = new Map<number, Row[]>();
        for (const row of episodeRows) {
          const seasonNum = parseNum(row.season_number);
          if (seasonNum === null) continue;
          if (!seasonMap.has(seasonNum)) seasonMap.set(seasonNum, []);
          seasonMap.get(seasonNum)!.push(row);
        }

        const totalEpisodes = episodeRows.filter(
          (ep) =>
            ep.episode_title &&
            parseNum(ep.season_number) !== null &&
            parseNum(ep.episode_number) !== null
        ).length;

        // 2a. Insert content row for the series
        const { data: contentData, error: contentErr } = await supabase
          .from("content")
          .insert([
            {
              title,
              description: sample.description || null,
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
              channel_id: sample.channel_id || null,
              completion_threshold_seconds: parseNum(sample.completion_threshold_seconds),
              seasons: seasonMap.size,
              episodes: totalEpisodes,
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

        // 2b. Insert seasons and their episodes
        for (const [seasonNumber, eps] of seasonMap.entries()) {
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

          const episodeInserts = eps
            .filter((ep) => ep.episode_title && parseNum(ep.episode_number) !== null)
            .map((ep) => ({
              season_id: seasonId,
              episode_number: parseNum(ep.episode_number) as number,
              title: ep.episode_title || null,
              description: ep.episode_description || null,
              video_url: ep.episode_videourl || null,
              duration_minutes: parseNum(ep.episode_duration),
              thumbnail_url: ep.episode_thumbnail_url || null,
              completion_threshold_seconds: parseNum(ep.episode_completion_threshold),
            }));

          if (episodeInserts.length) {
            const { error: epErr } = await supabase
              .from("episodes")
              .insert(episodeInserts);
            if (epErr) {
              console.error("Episodes insert error:", epErr);
              failContent++;
            }
          }
        }
      }

      setSuccess(
        `Import complete — ${successContent} content item(s) added.${
          failContent ? ` ${failContent} failed (check console).` : ""
        }`
      );
    } catch (err) {
      console.error("Unexpected import error:", err);
      setError("An unexpected error occurred during import. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  // ── Preview columns ───────────────────────────────────────────────────────
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
        <p>🎬 <strong>Movies:</strong> Fill in <code>title, type=movie, duration, videourl</code>. Optional: <code>completion_threshold_seconds, channel_id</code>. Leave season/episode columns empty.</p>
        <p>📺 <strong>Series:</strong> Repeat series info (title, genre, poster…) on <em>every episode row</em>. Fill in <code>season_number, episode_number, episode_title, episode_videourl</code>. Optional per episode: <code>episode_thumbnail_url, episode_completion_threshold</code>.</p>
        <p>✅ <code>featured</code>, <code>trending</code>, <code>is_kids</code> must be <strong>TRUE</strong> or <strong>FALSE</strong>.</p>
        <p>📡 <code>channel_id</code> must be the exact UUID of an existing channel (optional).</p>
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
            {rows.filter((r) => String(r.type || "").toLowerCase().trim() === "movie").length} movie row(s) ·{" "}
            {[...new Set(rows.filter((r) => String(r.type || "").toLowerCase().trim() === "series").map((r) => (r.title || "").trim().toLowerCase()))].length} unique series ·{" "}
            {rows.filter((r) => String(r.type || "").toLowerCase().trim() === "series").length} episode row(s)
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
