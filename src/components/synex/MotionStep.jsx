'use client';

import { motion } from 'framer-motion';

export function MotionStep({ children, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
