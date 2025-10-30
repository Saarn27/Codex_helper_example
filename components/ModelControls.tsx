"use client";

import { useEffect } from "react";

const PREF_KEY = "ai-chat-prefs-v1";

type ModelControlsProps = {
  model: string;
  setModel: (value: string) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  maxTokens: number | null;
  setMaxTokens: (value: number | null) => void;
  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
};

export default function ModelControls({
  model,
  setModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  systemPrompt,
  setSystemPrompt
}: ModelControlsProps) {
  useEffect(() => {
    try {
      const payload = {
        model,
        temperature,
        maxTokens,
        systemPrompt
      };
      localStorage.setItem(PREF_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to save preferences", error);
    }
  }, [model, temperature, maxTokens, systemPrompt]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div>
        <label htmlFor="model" className="block text-sm font-medium">
          Model
        </label>
        <select
          id="model"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
          value={model}
          onChange={(event) => setModel(event.target.value)}
        >
          <option value="gpt-5">gpt-5</option>
          <option value="gpt-4.1">gpt-4.1</option>
          <option value="gpt-4o-mini">gpt-4o-mini</option>
        </select>
      </div>
      <div>
        <label htmlFor="temperature" className="flex items-center justify-between text-sm font-medium">
          <span>Temperature</span>
          <span className="text-xs text-slate-500">{temperature.toFixed(2)}</span>
        </label>
        <input
          id="temperature"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={temperature}
          onChange={(event) => setTemperature(Number(event.target.value))}
          className="mt-1 w-full"
        />
      </div>
      <div>
        <label htmlFor="maxTokens" className="block text-sm font-medium">
          Max tokens (optional)
        </label>
        <input
          id="maxTokens"
          type="number"
          min={1}
          step={1}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
          value={maxTokens ?? ""}
          placeholder="e.g. 1024"
          onChange={(event) => {
            const value = event.target.value;
            if (value === "") {
              setMaxTokens(null);
              return;
            }
            const parsed = Number(value);
            setMaxTokens(Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : null);
          }}
        />
      </div>
      <div>
        <label htmlFor="systemPrompt" className="block text-sm font-medium">
          System prompt (optional)
        </label>
        <textarea
          id="systemPrompt"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-800"
          rows={3}
          value={systemPrompt}
          onChange={(event) => setSystemPrompt(event.target.value)}
          placeholder="You are a helpful assistant..."
        />
      </div>
    </section>
  );
}
