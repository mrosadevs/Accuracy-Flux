'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'pink' | 'green' | 'amber';
  delay?: number;
  format?: 'currency' | 'percentage' | 'number' | 'time';
}

const colorMap = {
  blue: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-100 text-primary-600',
    accent: 'text-primary-600',
    ring: 'ring-primary-100',
  },
  purple: {
    bg: 'bg-accent-400/5',
    icon: 'bg-accent-400/10 text-accent-600',
    accent: 'text-accent-600',
    ring: 'ring-accent-400/10',
  },
  pink: {
    bg: 'bg-pink-500/5',
    icon: 'bg-pink-500/10 text-pink-500',
    accent: 'text-pink-500',
    ring: 'ring-pink-500/10',
  },
  green: {
    bg: 'bg-success/5',
    icon: 'bg-success/10 text-success',
    accent: 'text-success',
    ring: 'ring-success/10',
  },
  amber: {
    bg: 'bg-warning/5',
    icon: 'bg-warning/10 text-warning',
    accent: 'text-warning',
    ring: 'ring-warning/10',
  },
};

/** Spring count-up so stats roll to their value instead of appearing. */
function AnimatedValue({ value, format }: { value: number; format?: StatCardProps['format'] }) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 22, mass: 0.9 });
  const display = useTransform(spring, (v) => {
    const rounded = Math.round(v);
    if (format === 'currency') return `$${rounded.toLocaleString()}`;
    if (format === 'percentage') return `${rounded}%`;
    return rounded.toLocaleString();
  });
  const mounted = useRef(false);

  useEffect(() => {
    if (reduceMotion && !mounted.current) motionValue.jump(value);
    else motionValue.set(value);
    mounted.current = true;
  }, [value, reduceMotion, motionValue]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

export default function StatCard({ title, value, change, changeLabel, icon: Icon, color, delay = 0, format }: StatCardProps) {
  const colors = colorMap[color];
  const isPositive = change && change > 0;

  const formatValue = (val: string | number) => {
    if (format === 'currency' && typeof val === 'number') {
      return `$${val.toLocaleString()}`;
    }
    if (format === 'percentage' && typeof val === 'number') {
      return `${val}%`;
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden bg-white rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-primary-500/5 transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div
          className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', colors.icon)}
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
        {change !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
            isPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{change}%
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        <p className="text-2xl font-bold text-text-primary tracking-tight">
          {typeof value === 'number' ? <AnimatedValue value={value} format={format} /> : formatValue(value)}
        </p>
        <p className="text-xs text-text-muted mt-1 font-medium">{title}</p>
        {changeLabel && (
          <p className="text-[10px] text-text-muted mt-0.5">{changeLabel}</p>
        )}
      </motion.div>

      {/* Subtle hover decoration */}
      <div className={clsx(
        'absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity',
        color === 'blue' && 'bg-gradient-to-r from-primary-400 to-primary-600',
        color === 'purple' && 'bg-gradient-to-r from-accent-400 to-accent-600',
        color === 'pink' && 'bg-gradient-to-r from-pink-400 to-pink-500',
        color === 'green' && 'bg-gradient-to-r from-green-400 to-green-500',
        color === 'amber' && 'bg-gradient-to-r from-amber-400 to-amber-500',
      )} />
    </motion.div>
  );
}
