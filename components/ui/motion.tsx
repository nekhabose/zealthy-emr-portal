"use client";

// Zealthy — reusable motion primitives (Phase 6).
//
// A small, disciplined set of Framer Motion (the `motion` package) wrappers used to
// guide attention, not decorate everything: entrance reveals, staggered card groups,
// and a subtle per-route transition. Every primitive consults `useReducedMotion()` —
// when the OS asks for reduced motion, transforms are dropped and only a short opacity
// change remains (content stays immediately visible), exactly as the brief requires.
//
// These are client components; they receive server-rendered children as props, so the
// pages/layouts that use them can stay Server Components. They wrap content in a
// <div>, so use them around cards/sections — not around <li>/<tr> where the extra
// element would break list/table semantics.

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

// Smooth ease-out curve for entrances (mirrors --ease-spring in globals.css).
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Fade + gentle rise as the element scrolls into view (runs once). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered container: animates its {@link StaggerItem} children in sequence as the
 * group scrolls into view. Reduced motion collapses the stagger to zero (all at once).
 */
export function Stagger({
  children,
  className,
  gap = 0.08,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
}) {
  const reduce = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : gap } },
  };
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

/** One item inside a {@link Stagger}. */
export function StaggerItem({
  children,
  className,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: EASE_OUT },
    },
  };
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/**
 * Per-route entrance: a short opacity + small translateY as a page mounts. Kept under
 * 600ms and reduced to a plain fade when the user prefers reduced motion.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
