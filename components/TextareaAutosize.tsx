"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TextareaHTMLAttributes } from "react";

type TextareaAutosizeProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxRows?: number;
};

const lineHeight = 24;

export default function TextareaAutosize({ maxRows = 10, ...props }: TextareaAutosizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const scrollHeight = el.scrollHeight;
    const maxHeight = maxRows * lineHeight;
    const height = Math.min(scrollHeight, maxHeight);
    el.style.height = `${Math.max(height, lineHeight)}px`;
  }, [maxRows]);

  useEffect(() => {
    resize();
  }, [resize, props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      className={`resize-none overflow-hidden ${props.className ?? ""}`}
      onInput={(event) => {
        props.onInput?.(event);
        resize();
      }}
    />
  );
}
