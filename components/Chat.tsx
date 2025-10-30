"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import MessageBubble, { DisplayMessage } from "./MessageBubble";
import ModelControls from "./ModelControls";
import TextareaAutosize from "./TextareaAutosize";

const HISTORY_KEY = "ai-chat-history-v1";
const PREF_KEY = "ai-chat-prefs-v1";

type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  ts: number;
};

type ChatHistory = {
  messages: ChatMessage[];
};

type Preferences = {
  model: string;
  temperature: number;
  maxTokens: number | null;
  systemPrompt: string;
};

const defaultPreferences: Preferences = {
  model: "gpt-5",
  temperature: 0.7,
  maxTokens: null,
  systemPrompt: ""
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingAssistant, setPendingAssistant] = useState<DisplayMessage | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        const parsed: ChatHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsed.messages)) {
          const safeMessages = parsed.messages
            .filter(
              (message): message is ChatMessage =>
                !!message &&
                (message.role === "system" || message.role === "user" || message.role === "assistant") &&
                typeof message.content === "string"
            )
            .map((message) => ({
              id: typeof message.id === "string" ? message.id : generateId(),
              role: message.role,
              content: message.content,
              ts: typeof message.ts === "number" ? message.ts : Date.now()
            }));
          setMessages(safeMessages);
        }
      }
    } catch (error) {
      console.warn("Failed to load chat history", error);
    }

    try {
      const storedPrefs = localStorage.getItem(PREF_KEY);
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        setPrefs((prev) => ({
          ...prev,
          ...parsed,
          temperature: typeof parsed.temperature === "number" ? parsed.temperature : prev.temperature,
          maxTokens: typeof parsed.maxTokens === "number" ? parsed.maxTokens : prev.maxTokens,
          model: typeof parsed.model === "string" ? parsed.model : prev.model,
          systemPrompt: typeof parsed.systemPrompt === "string" ? parsed.systemPrompt : prev.systemPrompt
        }));
      }
    } catch (error) {
      console.warn("Failed to load preferences", error);
    }
  }, []);

  useEffect(() => {
    const payload: ChatHistory = { messages };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(payload));
  }, [messages]);

  const displayMessages: DisplayMessage[] = useMemo(
    () =>
      messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          id: message.id,
          role: message.role as "user" | "assistant",
          content: message.content,
          ts: message.ts
        })),
    [messages]
  );

  useEffect(() => {
    if (!scrollAnchorRef.current) return;
    scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, pendingAssistant]);

  const approxTokenCount = useMemo(() => Math.ceil(input.length / 4), [input.length]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    setError(null);
    const now = Date.now();
    let workingMessages = [...messages];

    if (prefs.systemPrompt) {
      const systemIndex = workingMessages.findIndex((message) => message.role === "system");
      if (systemIndex === -1) {
        workingMessages = [
          {
            id: generateId(),
            role: "system",
            content: prefs.systemPrompt,
            ts: now
          },
          ...workingMessages
        ];
      } else if (workingMessages[systemIndex].content !== prefs.systemPrompt) {
        const updatedSystem: ChatMessage = {
          ...workingMessages[systemIndex],
          content: prefs.systemPrompt,
          ts: now
        };
        workingMessages = [
          updatedSystem,
          ...workingMessages.filter((_, index) => index !== systemIndex)
        ];
      }
    } else {
      workingMessages = workingMessages.filter((message) => message.role !== "system");
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      ts: now
    };

    const updatedMessages = [...workingMessages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    const body = {
      messages: updatedMessages.map(({ role, content }) => ({ role, content })),
      model: prefs.model,
      temperature: prefs.temperature,
      max_tokens: prefs.maxTokens ?? undefined
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        const message = await response.text();
        throw new Error(message || "Request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantContent = "";
      const assistantMessage: DisplayMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        ts: Date.now()
      };
      setPendingAssistant(assistantMessage);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setPendingAssistant((prev) =>
            prev ? { ...prev, content: assistantContent, ts: prev.ts } : assistantMessage
          );
        }
        done = readerDone;
      }
      const flush = decoder.decode();
      if (flush) {
        assistantContent += flush;
        setPendingAssistant((prev) =>
          prev ? { ...prev, content: assistantContent, ts: prev.ts } : assistantMessage
        );
      }

      const finalAssistant: ChatMessage = {
        id: assistantMessage.id,
        role: "assistant",
        content: assistantContent,
        ts: Date.now()
      };

      setMessages((prev) => [...prev, finalAssistant]);
      setPendingAssistant(null);
    } catch (error: unknown) {
      if ((error as Error).name === "AbortError") {
        setError("Streaming stopped.");
      } else {
        console.error("Chat request failed", error);
        setError(error instanceof Error ? error.message : "Something went wrong.");
      }
      setPendingAssistant(null);
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [input, isStreaming, messages, prefs.maxTokens, prefs.model, prefs.systemPrompt, prefs.temperature]);

  const handleClear = () => {
    setMessages([]);
    setPendingAssistant(null);
    setError(null);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleExport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      preferences: prefs,
      messages
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isStreaming) {
        stopStreaming();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isStreaming, stopStreaming]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 md:gap-6">
          <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-6" role="log" aria-live="polite">
              {displayMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {pendingAssistant ? (
                <MessageBubble message={pendingAssistant} isStreaming />
              ) : null}
              <div ref={scrollAnchorRef} />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Characters: {input.length} • Approx. tokens: {Number.isFinite(approxTokenCount) ? approxTokenCount : 0}
              </span>
              {isStreaming ? <span>Streaming…</span> : null}
            </div>
            <TextareaAutosize
              maxRows={10}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me anything…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
              aria-label="Message input"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className={classNames(
                  "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition",
                  {
                    "opacity-60": !input.trim() || isStreaming,
                    "hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500":
                      input.trim() && !isStreaming
                  }
                )}
              >
                Send (Ctrl/Cmd+Enter)
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Clear chat
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Export JSON
              </button>
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-500/60 dark:hover:bg-red-500/10"
                >
                  Stop
                </button>
              ) : null}
            </div>
            {error ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>
        <ModelControls
          model={prefs.model}
          setModel={(model) => setPrefs((prev) => ({ ...prev, model }))}
          temperature={prefs.temperature}
          setTemperature={(temperature) => setPrefs((prev) => ({ ...prev, temperature }))}
          maxTokens={prefs.maxTokens}
          setMaxTokens={(maxTokens) => setPrefs((prev) => ({ ...prev, maxTokens }))}
          systemPrompt={prefs.systemPrompt}
          setSystemPrompt={(systemPrompt) => setPrefs((prev) => ({ ...prev, systemPrompt }))}
        />
      </div>
      <div aria-live="polite" className="sr-only">
        {pendingAssistant?.content}
      </div>
    </div>
  );
}
