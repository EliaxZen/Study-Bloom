/**
 * Transições e variants compartilhados (Motion for React).
 * Preferir transform/opacity; respeitar prefers-reduced-motion.
 */

import { useEffect, useState } from "react";
import type { Transition, Variants } from "motion/react";

/** Spring suave — indicador da sidebar e microinterações */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.85,
};

/** Spring um pouco mais “premium” para pills / layoutId */
export const springPill: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

export const easeOutSoft: Transition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

export const pageTransition: Transition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
};

/** Entrada/saída de página (fade + leve sink/rise); exit absoluto evita altura dupla */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -6,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

export const pageVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: {
    opacity: 0,
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
};

/** Container com stagger para grids de cards */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

export const staggerContainerReduced: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0, delayChildren: 0 },
  },
};

/** Item que sobe com fade (filho do stagger) */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: easeOutSoft,
  },
};

export const staggerItemReduced: Variants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
};

/** Modal / dialog */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, scale: 0.94, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springSoft,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: { duration: 0.18 },
  },
};

export const modalPanelVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Toast — x: "-50%" mantém centralização sem conflitar com y/scale */
export const toastVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.96, x: "-50%" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    x: "-50%",
    transition: springSoft,
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    x: "-50%",
    transition: { duration: 0.18 },
  },
};

export const toastVariantsReduced: Variants = {
  initial: { opacity: 0, x: "-50%" },
  animate: { opacity: 1, x: "-50%" },
  exit: { opacity: 0, x: "-50%" },
};

/** Press feedback leve em botões */
export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: springSoft,
} as const;

export const pressableReduced = {
  whileHover: {},
  whileTap: {},
  transition: { duration: 0 },
} as const;

/** Hook: prefers-reduced-motion */
export function useReducedMotionPreference(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function getPageVariants(reduced: boolean): Variants {
  return reduced ? pageVariantsReduced : pageVariants;
}

export function getStaggerContainer(reduced: boolean): Variants {
  return reduced ? staggerContainerReduced : staggerContainer;
}

export function getStaggerItem(reduced: boolean): Variants {
  return reduced ? staggerItemReduced : staggerItem;
}
