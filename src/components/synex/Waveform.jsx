'use client';

import { motion } from 'framer-motion';

export function Waveform({ listening = false }) {
  if (!listening) {
    return (
      <div className="flex items-center justify-center h-24">
        <motion.div
          className="w-2 h-2 rounded-full bg-ink-3"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    );
  }
  return (
    <div className="flex items-end justify-center gap-1.5 h-24">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-[2px] bg-ink rounded-full"
          animate={{
            height: ['20%', '90%', '40%', '70%', '25%'],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.12,
          }}
          style={{ height: '40%' }}
        />
      ))}
    </div>
  );
}
