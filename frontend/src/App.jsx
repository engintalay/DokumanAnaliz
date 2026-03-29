import { useEffect, useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import ChatPanel from './components/ChatPanel';
import { getDocuments } from './api';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = useCallback(async () => {
    const docs = await getDocuments();
    setDocuments(docs);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // İşleniyor durumundaki dokümanları periyodik kontrol et
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing');
    if (!hasProcessing) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [documents, refresh]);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b">
        <h1 className="text-lg font-bold">Doküman Analiz</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl">☰</button>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-80 border-r flex-shrink-0 flex flex-col h-full md:h-screen overflow-hidden`}>
        <div className="p-4 border-b hidden md:block">
          <h1 className="text-xl font-bold">Doküman Analiz</h1>
        </div>
        <div className="p-4">
          <FileUpload onUploaded={() => refresh()} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <DocumentList
            documents={documents}
            selectedId={selectedDoc?.id}
            onSelect={(doc) => { setSelectedDoc(doc); setSidebarOpen(false); }}
            onDeleted={(id) => {
              if (selectedDoc?.id === id) setSelectedDoc(null);
              refresh();
            }}
          />
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedDoc && (
          <div className="px-4 py-2 border-b text-sm text-gray-500 flex items-center justify-between">
            <span>📄 {selectedDoc.filename}</span>
            <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ChatPanel selectedDoc={selectedDoc} />
        </div>
      </div>
    </div>
  );
}
