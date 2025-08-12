'use client';
import { motion } from 'framer-motion';

export const FadeInAnimation = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

export const MoveSidewayAnimation = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.ul
      animate={{
        x: [0, -1080],
      }}
      transition={{
        duration: 120, // 120 seconds for full cycle
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        display: 'flex',
        placeItems: 'flex-start',
        margin: '0px',
        padding: '0px',
        listStyleType: 'none',
        gap: '32px',
        position: 'relative',
        flexDirection: 'row',
        willChange: 'transform',
        width: 'calc(200%)', // Double width for seamless scrolling
        height: '100%',
      }}
    >
      {children}
    </motion.ul>
  );
};
