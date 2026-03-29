import { deleteDocument } from '../api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Bekliyor',
  processing: 'İşleniyor',
  completed: 'Tamamlandı',
  error: 'Hata',
};

export default function DocumentList({ documents, onSelect, onDeleted, selectedId }) {
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return;
    await deleteDocument(id);
    onDeleted?.(id);
  };

  if (!documents.length) {
    return <p className="text-gray-400 text-sm">Henüz doküman yok.</p>;
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          onClick={() => doc.status === 'completed' && onSelect?.(doc)}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
            selectedId === doc.id ? 'bg-blue-50 border border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{doc.filename}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[doc.status]}`}>
                {statusLabels[doc.status]}
              </span>
              {doc.page_count > 0 && (
                <span className="text-xs text-gray-400">{doc.page_count} sayfa</span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(e, doc.id)}
            className="text-gray-400 hover:text-red-500 ml-2 text-lg"
            title="Sil"
          >×</button>
        </li>
      ))}
    </ul>
  );
}
