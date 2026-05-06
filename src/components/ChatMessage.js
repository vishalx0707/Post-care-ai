'use client';

import { Bot, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatMessage.css';

export default function ChatMessage({ message, files }) {
  const isUser = message.role === 'user';

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-message chat-message--${message.role}`}>
      {!isUser && (
        <div className="chat-message__avatar">
          <Bot size={16} />
        </div>
      )}

      {isUser && files && files.length > 0 && (
        <div className="chat-message__files">
          {files.map((file) => (
            <span key={file.id} className="chat-message__file">
              <FileText size={12} />
              {file.file_name}
            </span>
          ))}
        </div>
      )}

      <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      <span className="chat-message__time">
        {formatTime(message.created_at)}
      </span>
    </div>
  );
}
