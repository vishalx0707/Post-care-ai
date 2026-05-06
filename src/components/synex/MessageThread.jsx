'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export function MessageThread({ messages, companionName, userName, streamingId }) {
  return (
    <div className="flex flex-col gap-10 max-w-[68ch] mx-auto w-full">
      {messages.map((m) => (
        <Message
          key={m.id}
          role={m.role}
          content={m.content}
          time={m.time}
          companionName={companionName}
          userName={userName}
          streaming={streamingId === m.id}
        />
      ))}
    </div>
  );
}

function Message({ role, content, time, companionName, userName, streaming }) {
  const isUser = role === 'user';
  const label = isUser ? (userName || 'you') : (companionName || 'companion');
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      className={cn('flex flex-col gap-2')}
    >
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
        <span className={cn('text-ink', !isUser && 'text-accent')}>{label}</span>
        {time && (
          <>
            <span className="w-0.5 h-0.5 rounded-full bg-ink-3" />
            <span>{time}</span>
          </>
        )}
      </div>
      <div className={cn('prose-synex', !isUser && 'border-l-2 border-accent pl-4')}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : content || streaming ? (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || ''}</ReactMarkdown>
            {streaming && <span className="synex-caret" />}
          </>
        ) : (
          <span className="synex-caret" />
        )}
      </div>
    </motion.div>
  );
}
