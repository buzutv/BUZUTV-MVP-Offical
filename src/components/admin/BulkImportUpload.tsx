import React, { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const TEMPLATE_URL = "https://docs.google.com/spreadsheets/d/1ichG0SyImNJT_5-6ztFweEJO-EKrV0R92-4gQQ7ymNU/edit?gid=1549738934#gid=1549738934";

const ALLOWED_COLUMNS = [
  'title',
  'type',
  'genre',
  'year',
  'rating',
  'poster url',
  'videourl',
  'duration',
  'seasons',
  'featured',
  'trending',
];

const BulkImportUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess("");
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        let parsedRows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        // Only keep allowed columns
        parsedRows = parsedRows.map((row: any) => {
          const filtered: any = {};
          ALLOWED_COLUMNS.forEach(col => {
            filtered[col] = row[col] ?? null;
          });
          return filtered;
        });
        setRows(parsedRows);
      } catch (err) {
        setError("Failed to parse Excel file. Please check the format.");
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const contentTableDefaults = {
    title: null,
    description: null,
    type: null,
    genre: null,
    year: null,
    rating: null,
    poster_url: null,
    backdrop_url: null,
    video_url: null,
    duration_minutes: null,
    seasons: null,
    episodes: null,
    channel_id: null,
    is_featured: false,
    is_trending: false,
    seasons_data: null,
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    if (!rows.length) {
      setError("No data to import.");
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const data of rows) {
      try {
        const contentData = {
          ...contentTableDefaults,
          ...{
            title: data.title || null,
            type: data.type || null,
            genre: data.genre || null,
            year: data.year ? parseInt(data.year) : null,
            rating: data.rating ? parseFloat(data.rating) : null,
            poster_url: data["poster url"] || null,
            video_url: data["videourl"] || null,
            duration_minutes: data.type === 'movie' && data.duration ? parseInt(data.duration) : null,
            seasons: data.type === 'series' && data.seasons ? parseInt(data.seasons) : null,
            is_featured: data.featured === true || data.featured === 'TRUE' || data.featured === 'true' ? true : false,
            is_trending: data.trending === true || data.trending === 'TRUE' || data.trending === 'true' ? true : false,
          }
        };
        const { error } = await supabase.from('content').insert([contentData]);
        if (error) {
          console.error('Supabase insert error:', error, contentData);
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        failCount++;
      }
    }
    setSuccess(`Successfully added ${successCount} items. ${failCount > 0 ? failCount + ' failed.' : ''}`);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Bulk Import Content</h3>
        <a
          href={TEMPLATE_URL}
          download
          className="text-blue-400 hover:underline text-sm"
          target="_blank"
        >
          Download Excel Template
        </a>
      </div>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="mb-4 block text-white"
      />
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {success && <div className="text-green-400 mb-2">{success}</div>}
      {rows.length > 0 && (
        <div className="mb-4">
          <div className="text-gray-300 mb-2">Preview (first 5 rows):</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-gray-200">
              <thead>
                <tr>
                  {ALLOWED_COLUMNS.map((col) => (
                    <th key={col} className="px-2 py-1 border-b border-gray-700">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {ALLOWED_COLUMNS.map((col) => (
                      <td key={col} className="px-2 py-1 border-b border-gray-700">
                        {col === 'featured' || col === 'trending'
                          ? row[col] === true || row[col] === 'TRUE'
                            ? 'TRUE'
                            : row[col] === false || row[col] === 'FALSE'
                              ? 'FALSE'
                              : ''
                          : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <button
        onClick={handleCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!rows.length}
      >
        Create
      </button>
    </div>
  );
};

export default BulkImportUpload; 