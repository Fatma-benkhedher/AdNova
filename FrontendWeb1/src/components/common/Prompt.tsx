import { useEffect } from "react";

interface PromptProps {
  visible: boolean;
  message: string;
  variant?: "success" | "error" | "info";
  onClose?: () => void;
}

export default function Prompt({ visible, message, variant = "info", onClose }: PromptProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClose && onClose(), 4000);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible) return null;

  const base =
    "fixed left-1/2 top-6 z-50 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md bg-black/40 border border-white/10 flex items-center gap-3 max-w-xl w-[90%] sm:w-auto";

  // stronger text color for better contrast
  const color =
    variant === "success"
      ? "text-white"
      : variant === "error"
      ? "text-white"
      : "text-white";

  const icon =
    variant === "success" ? (
      <svg className="w-6 h-6 text-green-400 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L8 11.172 4.707 7.879a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
      </svg>
    ) : variant === "error" ? (
      <svg className="w-6 h-6 text-red-400 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3a1 1 0 11-2 0zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-6 h-6 text-sky-400 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8z" />
      </svg>
    );

  return (
    <div className={`${base} ${color}`} role="status" aria-live="polite">
      {icon}
      <div className="flex-1 text-sm font-semibold leading-tight text-white">{message}</div>
      <button
        onClick={() => onClose && onClose()}
        aria-label="Close prompt"
        className="text-white/70 hover:text-white"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
