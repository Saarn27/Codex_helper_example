import { NextRequest } from "next/server";
import OpenAI from "openai";
import { openai } from "../../../lib/openai";

const MAX_INPUT_CHARS = 20000;
const encoder = new TextEncoder();

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, temperature, max_tokens } = body ?? {};

    if (!Array.isArray(messages) || typeof model !== "string") {
      return new Response("Invalid request payload.", { status: 400 });
    }

    const temperatureValue = typeof temperature === "number" ? temperature : undefined;
    const maxTokensValue = typeof max_tokens === "number" ? max_tokens : undefined;

    const sanitized: Message[] = [];
    for (const message of messages as Message[]) {
      if (
        !message ||
        (message.role !== "system" && message.role !== "user" && message.role !== "assistant") ||
        typeof message.content !== "string"
      ) {
        return new Response("Invalid message format.", { status: 400 });
      }
      sanitized.push({
        role: message.role,
        content: message.content.slice(0, MAX_INPUT_CHARS)
      });
    }

    const totalLength = sanitized.reduce((acc, message) => acc + message.content.length, 0);

    if (totalLength > MAX_INPUT_CHARS) {
      return new Response("Input too long. Please shorten your message.", { status: 413 });
    }

    let stream: ReadableStream<Uint8Array> | null = null;

    if (typeof (openai as any).responses?.stream === "function") {
      try {
        const responseStream = await openai.responses.stream({
          model,
          input: sanitized.map((message) => ({
            role: message.role,
            content: [{ type: "text", text: message.content }]
          })),
          temperature: temperatureValue,
          max_output_tokens: maxTokensValue
        });

        stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              for await (const event of responseStream) {
                if (event.type === "response.output_text.delta") {
                  controller.enqueue(encoder.encode(event.delta));
                } else if (event.type === "response.error") {
                  controller.error(new Error(event.error.message));
                  return;
                }
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
          cancel() {
            responseStream.controller?.abort();
          }
        });
      } catch (error) {
        console.warn("Responses API streaming failed, falling back to Chat Completions.", error);
      }
    }

    if (!stream) {
      const completion = await openai.chat.completions.create({
        model,
        messages: sanitized,
        temperature: temperatureValue,
        max_tokens: maxTokensValue,
        stream: true
      });

      stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const part of completion) {
              const delta = part.choices[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(delta));
              }
            }
          } catch (error) {
            controller.error(error);
            return;
          }
          controller.close();
        }
      });
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return new Response("Invalid OpenAI API key.", { status: 401 });
      }
      if (error.status === 429) {
        return new Response("Rate limit exceeded. Please wait and try again.", { status: 429 });
      }
      return new Response(error.message ?? "OpenAI API error.", { status: error.status ?? 500 });
    }

    console.error("Unexpected error", error);
    return new Response("Server error.", { status: 500 });
  }
}
