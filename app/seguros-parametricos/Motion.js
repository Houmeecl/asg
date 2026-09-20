'use client';

// Animaciones con Motion (Framer Motion). Respetan "reducir movimiento" del sistema.
import { useEffect, useRef } from 'react';
import { MotionConfig, motion, useInView, useMotionValue, useScroll, useSpring, useTransform, animate } from 'motion/react';

export function MotionRoot({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Aparece subiendo suavemente al entrar en pantalla.
export function Reveal({ children, delay = 0, y = 24, className = '', as = 'div' }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

// Grupo que escalona la aparición de sus hijos <Item>.
export function Stagger({ children, className = '', gap = 0.08 }) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ staggerChildren: gap }}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{ oculto: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
    >
      {children}
    </motion.div>
  );
}

// Tarjeta que se eleva al pasar el cursor.
export function Lift({ children, className = '' }) {
  return (
    <motion.div className={className} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      {children}
    </motion.div>
  );
}

// Fondo con parallax: se desplaza más lento que el scroll.
export function Parallax({ children, className = '', distancia = 80 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, distancia]);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div className="absolute -inset-x-0 -top-10 -bottom-24" style={{ y }}>{children}</motion.div>
    </div>
  );
}

// Número que cuenta hasta su valor al entrar en pantalla.
export function Contador({ hasta, formato = (n) => Math.round(n).toLocaleString('es-CL'), duracion = 1.4, className = '' }) {
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, margin: '-40px' });
  const valor = useMotionValue(0);
  const suave = useSpring(valor, { duration: duracion * 1000, bounce: 0 });

  useEffect(() => {
    if (visible) valor.set(hasta);
  }, [visible, hasta, valor]);
  useEffect(() => suave.on('change', (v) => { if (ref.current) ref.current.textContent = formato(v); }), [suave, formato]);

  return <span ref={ref} className={className}>{formato(0)}</span>;
}

// Trazo que se dibuja (línea de gráfico).
export function Trazo({ d, className = '', stroke = 'currentColor', ancho = 3, duracion = 1.8 }) {
  return (
    <motion.path
      d={d} fill="none" stroke={stroke} strokeWidth={ancho} strokeLinejoin="round" strokeLinecap="round" className={className}
      initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: duracion, ease: 'easeInOut' }}
    />
  );
}

export { motion, animate };
