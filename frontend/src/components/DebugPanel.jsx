import { useState } from 'react';

export default function DebugPanel({ selectedDoc }) {
  const [tab, setTab] = useState('chunks');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (url) => {
    setLoading(true);
    try {
      const res = await fetch(url);
      setData(await res.json());
    } catch (e) {
      setData({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const loadChunks = () => selectedDoc && fetchData(`/api/debug/chunks/${selectedDoc.id}`);
  const loadOcr = () => selectedDoc && fetchData(`/api/debug/ocr/${selectedDoc.id}`);
  const loadStats = () => fetchData('/api/debug/chroma-stats');
  const doSearch = () => {
    if (!searchQuery.trim()) return;
    const params = new URLSearchParams({ q: searchQuery });
    if (selectedDoc) params.set('doc_id', selectedDoc.id);
    fetchData(`/api/debug/search?${params}`);
  };

  return (
    <div className="border-t bg-gray-50 max-h-80 overflow-y-auto text-xs">
      <div className="flex items-center gap-1 p-2 border-b bg-white sticky top-0">
        <span className="font-bold text-gray-500 mr-2">🔍 Debug</span>
        {['chunks', 'ocr', 'search', 'stats'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-1 rounded ${tab === t ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="p-2">
        {tab === 'chunks' && (
          <div>
            <button onClick={loadChunks} disabled={!selectedDoc} className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50">Chunk'ları Yükle</button>
            {!selectedDoc && <span className="ml-2 text-gray-400">Doküman seçin</span>}
          </div>
        )}
        {tab === 'ocr' && (
          <div>
            <button onClick={loadOcr} disabled={!selectedDoc} className="bg-blue-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50">OCR Metnini Yükle</button>
          </div>
        )}
        {tab === 'search' && (
          <div className="flex gap-2">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Arama sorgusu..." className="flex-1 border rounded px-2 py-1" />
            <button onClick={doSearch} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Ara</button>
          </div>
        )}
        {tab === 'stats' && (
          <button onClick={loadStats} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">İstatistikleri Yükle</button>
        )}

        {loading && <p className="mt-2 text-gray-400">Yükleniyor...</p>}

        {data && !loading && (
          <pre className="mt-2 bg-white border rounded p-2 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
