const API = '/api';

export async function uploadDocument(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/documents/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDocuments() {
  const res = await fetch(`${API}/documents/`);
  return res.json();
}

export async function getDocument(id) {
  const res = await fetch(`${API}/documents/${id}`);
  return res.json();
}

export async function deleteDocument(id) {
  const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function askQuestion(question, documentId = null) {
  const res = await fetch(`${API}/qa/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, document_id: documentId })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function healthCheck() {
  const res = await fetch(`${API}/health`);
  return res.json();
}
