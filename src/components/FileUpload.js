'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import './FileUpload.css';

export default function FileUpload({ onFileUpload }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File must be under 10MB');
        continue;
      }
      await onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`file-upload-zone ${isDragActive ? 'file-upload-zone--active' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload size={24} className="file-upload-zone__icon" />
      <p className="file-upload-zone__text">
        {isDragActive
          ? 'Drop your files here'
          : 'Drag & drop medical reports here, or click to browse'}
      </p>
      <p className="file-upload-zone__hint">PDF, PNG, JPG, WEBP (max 10MB)</p>
    </div>
  );
}
