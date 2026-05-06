'use client';

import { useRef, useState, useEffect } from 'react';
import { Paperclip, SendHorizontal, Square, X, FileText, Image } from 'lucide-react';
import './ChatInput.css';

export default function ChatInput({ onSend, onUpload, isLoading, onStop }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle paste images from clipboard
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setUploading(true);
            const uploaded = await onUpload(file);
            if (uploaded) {
              setFiles((prev) => [...prev, uploaded]);
            }
            setUploading(false);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onUpload]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    if (isLoading || uploading) return;

    const uploadIds = files.map((f) => f.id);
    onSend(trimmed, uploadIds);
    setText('');
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File must be under 10MB');
        continue;
      }
      const uploaded = await onUpload(file);
      if (uploaded) {
        setFiles((prev) => [...prev, uploaded]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="chat-input">
      {files.length > 0 && (
        <div className="chat-input__files">
          {files.map((file) => (
            <span key={file.id} className="chat-input__file-chip">
              {file.file_type?.startsWith('image/') ? <Image size={12} /> : <FileText size={12} />}
              {file.file_name}
              <button
                className="chat-input__file-remove"
                onClick={() => removeFile(file.id)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {uploading && (
        <div className="chat-input__uploading">
          <div className="spinner" style={{ width: 14, height: 14 }} />
          Uploading...
        </div>
      )}

      <div className="chat-input__form">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          multiple
          hidden
          onChange={handleFileSelect}
        />
        <button
          className="chat-input__btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file (or paste an image)"
          type="button"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          placeholder="Describe your health concern, upload a report, or paste an image..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {isLoading ? (
          <button
            className="chat-input__btn chat-input__btn--stop"
            onClick={onStop}
            title="Stop"
            type="button"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            className="chat-input__btn chat-input__btn--send"
            onClick={handleSubmit}
            disabled={(!text.trim() && files.length === 0) || uploading}
            title="Send"
            type="button"
          >
            <SendHorizontal size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
