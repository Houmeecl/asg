'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const PARTS = [
  { ch: 's', accent: false },
  { ch: 'i', accent: false },
  { ch: 'c', accent: false },
  { ch: 'r', accent: false },
  { ch: '3', accent: true },
  { ch: 'p', accent: false },
  { ch: '/', accent: true },
];

/**
 * Wordmark tipográfico sicr3p/ — 3 y / en acento violeta (mock Framer).
 * SSR siempre visible (initial=false); stagger solo tras mount.
 */
export default function SicrWordmark({
  size = 'md',
  contrast = 'dark',
  animate = true,
  className = '',
  ariaLabel = 'sicr3p/',
}) {
  const reduce = useReducedMotion();
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setPlay(true), 30);
    return () => clearTimeout(id);
  }, []);

  const sizeClass =
    size === 'lg' ? 'wm-lg' : size === 'sm' ? 'wm-sm' : size === 'xs' ? 'wm-xs' : 'wm-md';
  const contrastClass = contrast === 'light' ? 'wm-light' : 'wm-dark';
  const shouldAnimate = animate && !reduce && play;

  return (
    <motion.span
      className={`sicr-wordmark ${sizeClass} ${contrastClass} ${className}`.trim()}
      aria-label={ariaLabel}
      initial={shouldAnimate ? 'hidden' : false}
      animate="show"
      variants={{
        hidden: {},
        show: shouldAnimate
          ? { transition: { staggerChildren: 0.05, delayChildren: 0.04 } }
          : {},
      }}
    >
      {PARTS.map((p, i) => (
        <motion.span
          key={`${p.ch}-${i}`}
          className={p.accent ? 'wm-accent' : 'wm-base'}
          variants={
            shouldAnimate
              ? {
                  hidden: { opacity: 0, y: 10 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: 'spring', stiffness: 420, damping: 28 },
                  },
                }
              : undefined
          }
        >
          {p.ch}
        </motion.span>
      ))}
    </motion.span>
  );
}
