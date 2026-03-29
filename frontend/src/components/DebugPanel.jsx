import { useState } from 'react';

export default function DebugPanel({ selectedDoc }) {
  const [tab, setTab] = useState('preview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (url) => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(url);
      setData(await res.json());
    } catch (e) {
      setData({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['preview', 'chunks', 'ocr', 'search', 'stats'];

  return (
    <div className="border-t bg-gray-50 max-h-96 overflow-y-auto text-xs">
      <div className="flex items-center gap-1 p-2 border-b bg-white sticky top-0 z-10">
        <span className="font-bold text-gray-500 mr-2">🔍 Debug</span>
        {tabs.map((t) => (
          <button key={t} onClick={() => { setTab(t); setData(null); }}
            className={`px-2 py-1 rounded ${tab === t ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="p-2">
        {/* Preview */}
        {tab === 'preview' && (
          selectedDoc ? (
            <div className="bg-white border rounded p-1">
              {selectedDoc.filename.match(/\.(png|jpg|jpeg|webp|bmp|tiff|tif|gif)$/i) ? (
                <img src={`/api/documents/${selectedDoc.id}/file`} alt={selectedDoc.filename} className="max-w-full max-h-72 mx-auto" />
              ) : selectedDoc.filename.match(/\.pdf$/i) ? (
                <iframe src={`/api/documents/${selectedDoc.id}/file`} className="w-full h-72" title={selectedDoc.filename} />
              ) : (
                <p className="text-gray-400 p-4">Önizleme desteklenmiyor</p>
              )}
            </div>
          ) : <p className="text-gray-400">Doküman seçin</p>
        )}

        {/* Chunks */}
        {tab === 'chunks' && (
          <div>
            <button onClick={() => selectedDoc && fetchData(`/api/debug/chunks/${selectedDoc.id}`)}
              disabled={!selectedDoc} className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50">
              Chunk'ları Yükle
            </button>
            {!selectedDoc && <span className="ml-2 text-gray-400">Doküman seçin</span>}
          </div>
        )}

        {/* OCR */}
        {tab === 'ocr' && (
          <button onClick={() => selectedDoc && fetchData(`/api/debug/ocr/${selectedDoc.id}`)}
            disabled={!selectedDoc} className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50">
            OCR Metnini Yükle
          </button>
        )}

        {/* Search */}
        {tab === 'search' && (
          <div className="flex gap-2">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() && fetchData(`/api/debug/search?q=${encodeURIComponent(searchQuery)}${selectedDoc ? `&doc_id=${selectedDoc.id}` : ''}`)}
              placeholder="Arama sorgusu..." className="flex-1 border rounded px-2 py-1" />
            <button onClick={() => searchQuery.trim() && fetchData(`/api/debug/search?q=${encodeURIComponent(searchQuery)}${selectedDoc ? `&doc_id=${selectedDoc.id}` : ''}`)}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Ara</button>
          </div>
        )}

        {/* Stats */}
        {tab === 'stats' && (
          <button onClick={() => fetchData('/api/debug/chroma-stats')}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs">İstatistikleri Yükle</button>
        )}

        {loading && <p className="mt-2 text-gray-400">Yükleniyor...</p>}
        {data && !loading && tab !== 'preview' && (
          <pre className="mt-2 bg-white border rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
