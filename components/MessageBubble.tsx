"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import classNames from "classnames";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import "prismjs/themes/prism-tomorrow.css";

export type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

type MessageBubbleProps = {
  message: DisplayMessage;
  isStreaming?: boolean;
};

function CodeBlock({
  inline,
  className,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const languageMatch = /language-(\w+)/.exec(className || "");
  const text = String(children ?? "").replace(/\n$/, "");

  if (inline) {
    return (
      <code className="rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800" {...props}>
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code block"
        className="absolute right-2 top-2 rounded border border-slate-400 bg-white/80 px-2 py-1 text-xs font-medium opacity-0 transition group-hover:opacity-100 dark:border-slate-500 dark:bg-slate-800/80"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className={classNames(className, "overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950")}
        {...props}
      >
        <code className={className}>{children}</code>
      </pre>
      {languageMatch ? (
        <span className="absolute left-2 top-2 text-xs uppercase tracking-wide text-slate-400">
          {languageMatch[1]}
        </span>
      ) : null}
    </div>
  );
}

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={classNames("flex flex-col gap-1", {
        "items-end": isUser,
        "items-start": !isUser
      })}
    >
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {new Date(message.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div
        className={classNames("max-w-full rounded-2xl px-4 py-3", {
          "bg-blue-600 text-white": isUser,
          "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100": !isUser
        })}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[[rehypePrism, { ignoreMissing: true }]]}
              components={{
                code: CodeBlock as any
              }}
            >
              {message.content || (isStreaming ? "…" : "")}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </article>
  );
}
