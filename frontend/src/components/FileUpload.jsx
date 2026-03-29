import { useCallback, useState } from 'react';
import { uploadDocument } from '../api';

export default function FileUpload({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(async (file) => {
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      onUploaded?.(doc);
    } catch (e) {
      alert('Yükleme hatası: ' + e.message);
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
        dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => document.getElementById('file-input').click()}
    >
      <input
        id="file-input"
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.tif,.bmp"
        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
      />
      {uploading ? (
        <p className="text-gray-500">Yükleniyor...</p>
      ) : (
        <>
          <p className="text-lg font-medium text-gray-600">Doküman yükle</p>
          <p className="text-sm text-gray-400 mt-1">PDF, PNG, JPG, WEBP, TIFF, BMP</p>
        </>
      )}
    </div>
  );
}
