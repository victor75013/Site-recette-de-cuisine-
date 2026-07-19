import React from 'react';
import { motion } from 'framer-motion';

export default function PageTransition({ children }) {
  // Animation standard pour les changements de pages (Fade in/out léger)
  // On peut l'adapter selon les besoins
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
