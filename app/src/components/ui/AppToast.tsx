import { AnimatePresence, motion } from "motion/react";
import {
  toastVariants,
  toastVariantsReduced,
  useReducedMotionPreference,
} from "../../lib/motion";
import { useToastStore } from "../../stores/toastStore";

export function AppToast() {
  const message = useToastStore((s) => s.message);
  const toastId = useToastStore((s) => s.toastId);
  const reduced = useReducedMotionPreference();

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key={toastId}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 left-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] max-w-sm rounded-2xl bg-ink px-4 py-3 text-center text-sm font-medium text-white shadow-lg sm:bottom-6"
          variants={reduced ? toastVariantsReduced : toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
