import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ selectedDoc }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    const assistantMsg = { role: 'assistant', content: '', thinking: '', sources: [], done: false };
    setMessages((prev) => [...prev, assistantMsg]);
    const msgIndex = messages.length + 1;

    try {
      const res = await fetch('/api/qa/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, document_id: selectedDoc?.id })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const data = JSON.parse(payload);
            setMessages((prev) => {
              const updated = [...prev];
              const msg = { ...updated[msgIndex] };
              if (data.type === 'thinking') msg.thinking += data.content;
              else if (data.type === 'content') msg.content += data.content;
              else if (data.type === 'sources') msg.sources = data.sources;
              else if (data.type === 'error') msg.content += `\n\nHata: ${data.content}`;
              updated[msgIndex] = msg;
              return updated;
            });
          } catch {}
        }
      }
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], content: 'Bağlantı hatası: ' + e.message };
        return updated;
      });
    } finally {
      setMessages((prev) => {
        const updated = [...prev];
        updated[msgIndex] = { ...updated[msgIndex], done: true };
        return updated;
      });
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
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}>
              {/* Thinking balloon */}
              {msg.thinking && (
                <details className="mb-2" open={!msg.done}>
                  <summary className="cursor-pointer text-xs text-purple-600 font-medium">
                    💭 {msg.done ? 'Düşünce süreci' : 'Düşünüyor...'}
                  </summary>
                  <div className="mt-1 p-2 bg-purple-50 rounded-lg text-xs text-purple-800 whitespace-pre-wrap">
                    {msg.thinking}
                  </div>
                </details>
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
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
        <div ref={bottomRef} />
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
