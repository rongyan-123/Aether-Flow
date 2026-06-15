"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: "half" | "full";
}

export function MobileSheet({
  open,
  onClose,
  title,
  children,
  height = "half",
}: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startY.current = e.touches[0].clientY;
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      currentY.current = e.touches[0].clientY;
      const delta = currentY.current - startY.current;
      if (delta > 80) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            className={
              "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-zinc-900 border-t border-zinc-800 shadow-2xl md:hidden " +
              (height === "full"
                ? "top-4"
                : "max-h-[85vh]")
            }
          >
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-600" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-200 font-chinese">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 56px)" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
