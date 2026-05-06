'use client';

import { motion } from 'framer-motion';

export function MotionList({ children, className, stagger = 0.04, ...props }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className, ...props }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
