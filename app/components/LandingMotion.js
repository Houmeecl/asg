'use client';

import { motion, useReducedMotion } from 'framer-motion';

const VIEWPORT = { once: true, amount: 0.18 };
const EASE = [0.22, 1, 0.36, 1];

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: EASE },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

export function MotionHeader({ children, className, ...props }) {
  const reduced = useReducedMotion();
  return (
    <motion.header
      className={className}
      {...props}
      initial={reduced ? false : { opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      {children}
    </motion.header>
  );
}

export function Reveal({ children, className, delay = 0, as = 'div', ...props }) {
  const reduced = useReducedMotion();
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      {...props}
      variants={reveal}
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={VIEWPORT}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}

export function Stagger({ children, className, as = 'div', ...props }) {
  const reduced = useReducedMotion();
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      {...props}
      variants={stagger}
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, as = 'div', ...props }) {
  const reduced = useReducedMotion();
  const Component = motion[as] || motion.div;
  return (
    <Component
      className={className}
      {...props}
      variants={reduced ? undefined : reveal}
      whileHover={reduced ? undefined : { y: -6, scale: 1.015 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {children}
    </Component>
  );
}

export function HeroVisualMotion({ children, className, ...props }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      {...props}
      initial={reduced ? false : { opacity: 0, x: 52, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.18, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Floating({ children, className, ...props }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      {...props}
      animate={reduced ? undefined : { y: [0, -7, 0] }}
      transition={
        reduced
          ? undefined
          : { duration: 4.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
      }
    >
      {children}
    </motion.div>
  );
}

export function Metric({ children, className, ...props }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      {...props}
      variants={reduced ? undefined : reveal}
      whileHover={reduced ? undefined : { scale: 1.05 }}
      transition={{ duration: 0.28, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

