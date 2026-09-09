import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface GlassSelectOption {
  value: string;
  label: string;
  badge?: string;
  color?: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (GlassSelectOption | string)[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
  size?: "xs" | "sm" | "md";
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "请选择...",
  className = "",
  menuClassName = "",
  align = "left",
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: GlassSelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const sizeClasses = {
    xs: "px-2 py-1 text-xs rounded-lg gap-1.5",
    sm: "px-2.5 py-1.5 text-xs rounded-xl gap-2",
    md: "px-3.5 py-2 text-sm rounded-xl gap-2.5",
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${
        className.includes("w-full") ? "w-full" : ""
      }`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between text-white font-medium transition-all duration-200 cursor-pointer select-none
          bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18]
          border border-white/20 hover:border-white/30
          backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12)]
          focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40
          ${sizeClasses}
          ${className}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Frosted Glass Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[150] mt-1.5 min-w-full ${
              align === "right" ? "right-0" : "left-0"
            } w-max max-w-xs
              bg-[#121927]/80 dark:bg-[#0D131F]/85
              backdrop-blur-2xl
              border border-white/20
              shadow-[0_16px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)]
              rounded-2xl p-1.5 overflow-hidden
              ${menuClassName}`}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
              {normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer
                      ${
                        isSelected
                          ? "bg-[#007AFF] text-white shadow-sm font-semibold"
                          : "text-white/90 hover:text-white hover:bg-white/15 active:bg-white/20"
                      }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlassSelect;
