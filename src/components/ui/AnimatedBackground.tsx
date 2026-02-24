'use client';

import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Floating orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px] animate-orb-1"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', top: '5%', left: '10%' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-25 dark:opacity-15 blur-[80px] animate-orb-2"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)', top: '30%', right: '5%' }}
      />
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full opacity-20 dark:opacity-15 blur-[90px] animate-orb-3"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)', bottom: '10%', left: '30%' }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.8) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
    </div>
  );
}
