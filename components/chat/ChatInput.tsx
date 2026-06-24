"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { ArrowRight, Camera, X } from "lucide-react";
import { clsx } from "clsx";

const SUGGESTIONS = [
  "Show me casual shirts for men",
  "Find a dress for a party",
  "Ethnic wear under ₹1500",
  "Suggest a complete office outfit",
];

interface Props {
  onSend: (text: string) => void;
  onImageSend?: (base64: string, filename: string) => void;
  disabled?: boolean;
  showSuggestions?: boolean;
  agentName?: string;
  suggestions?: string[];
}

interface PendingImage {
  base64: string;
  filename: string;
  preview: string;
}

export function ChatInput({ onSend, onImageSend, disabled, showSuggestions, agentName = "your stylist", suggestions }: Props) {
  const chips = suggestions ?? SUGGESTIONS;
  const [value, setValue] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (disabled) return;
    if (pendingImage) {
      if (!onImageSend) return;
      onImageSend(pendingImage.base64, pendingImage.filename);
      setPendingImage(null);
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImageSend) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      setPendingImage({ base64, filename: file.name, preview: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const canSend = pendingImage !== null || value.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Suggestion chips */}
      {showSuggestions && !pendingImage && (
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {chips.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={disabled}
              className="font-sans text-[10px] tracking-[0.15em] uppercase text-taupe hover:text-dark border-b border-transparent hover:border-gold transition-all duration-200 pb-0.5 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Image preview */}
      {pendingImage && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingImage.preview}
            alt="Selected image"
            className="h-24 w-auto max-w-[180px] object-cover border border-border rounded"
          />
          <button
            onClick={() => setPendingImage(null)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-dark text-cream flex items-center justify-center hover:bg-warm transition-colors"
            aria-label="Remove image"
          >
            <X size={10} strokeWidth={2} />
          </button>
          <p className="font-mono text-[9px] text-taupe mt-1 truncate max-w-[180px]">{pendingImage.filename}</p>
        </div>
      )}

      {/* Input row */}
      <div className="underline-sweep border-b border-border group/input">
        <div className="flex items-end gap-3 pb-3">
          <span className="text-gold text-sm flex-shrink-0 mb-0.5 transition-transform duration-300 group-focus-within/input:scale-110">
            ✦
          </span>
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => { setValue(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
            placeholder={pendingImage ? "Add a caption or just press send…" : `Ask ${agentName} anything — dresses, shirts, outfit ideas…`}
            disabled={disabled}
            className="flex-1 resize-none outline-none font-sans text-sm text-dark placeholder:text-border bg-transparent leading-relaxed disabled:opacity-40"
            style={{ minHeight: "28px" }}
          />

          {/* Image upload */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
          {onImageSend && !pendingImage && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              aria-label="Upload image to search"
              className="flex-shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-taupe hover:border-dark hover:text-dark transition-all duration-200 mb-0.5 disabled:opacity-40"
            >
              <Camera size={13} strokeWidth={1.5} />
            </button>
          )}

          <button
            onClick={submit}
            disabled={!canSend || disabled}
            aria-label="Send message"
            className={clsx(
              "flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 mb-0.5",
              canSend && !disabled
                ? "border-dark bg-dark text-gold hover:bg-charcoal"
                : "border-border text-border cursor-not-allowed"
            )}
          >
            <ArrowRight size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
