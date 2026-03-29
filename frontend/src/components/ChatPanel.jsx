import { useState } from 'react';
import { askQuestion } from '../api';

export default function ChatPanel({ selectedDoc }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await askQuestion(q, selectedDoc?.id);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer, sources: res.sources }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Hata: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-8">
            {selectedDoc ? `"${selectedDoc.filename}" hakkında soru sorun` : 'Bir doküman seçin veya genel soru sorun'}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
              {msg.sources?.length > 0 && (
                <details className="mt-2 text-xs text-gray-500">
                  <summary className="cursor-pointer">Kaynaklar ({msg.sources.length})</summary>
                  <ul className="mt-1 space-y-1">
                    {msg.sources.map((s, j) => (
                      <li key={j} className="bg-white p-2 rounded">{s.text}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-400">Düşünüyor...</div>
          </div>
        )}
      </div>
      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Sorunuzu yazın..."
          className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50"
        >Gönder</button>
      </div>
    </div>
  );
}
