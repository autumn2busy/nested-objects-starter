import { NextResponse } from "next/server";

const OPENAI_TIMEOUT_MS = 30_000;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function isValidMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== "object") return false;

  const { role, content } = message as Partial<ChatMessage>;

  return (
    (role === "system" || role === "user" || role === "assistant") &&
    typeof content === "string" &&
    content.length > 0
  );
}

function startOpenAITimeout() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("OpenAI request timed out")), OPENAI_TIMEOUT_MS);

  return {
    controller,
    clearTimeout: () => clearTimeout(timeoutId),
  };
}

function mapOpenAIError(status: number, body: string) {
  console.error("[AI_CHAT_ERROR_RESPONSE]", status, body);

  const detail = body.trim();
  const safeDetail = detail ? ` Details: ${detail.slice(0, 240)}` : "";

  return NextResponse.json(
    { error: `OpenAI request failed (status ${status}). Please retry shortly.${safeDetail}` },
    { status: 502 }
  );
}

function handleAbortError(error: unknown) {
  if ((error as Error | undefined)?.name === "AbortError") {
    return NextResponse.json(
      {
        error:
          "The OpenAI request timed out. Please retry or shorten your message so we can respond faster.",
      },
      { status: 504 }
    );
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body?.messages as ChatMessage[] | undefined;

    const apiKey =
      process.env.OPENAI_API_KEY ??
      process.env.OPENAI_KEY ??
      process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "The AI concierge is temporarily unavailable. Please try again shortly or contact support.",
        },
        { status: 503 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const streamingPayload = {
      model: "gpt-4o-mini",
      messages,
      stream: true,
    };

    const streamingTimeout = startOpenAITimeout();

    try {
      const streamingResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify(streamingPayload),
        signal: streamingTimeout.controller.signal,
      });

      streamingTimeout.clearTimeout();

      if (streamingResponse.ok && streamingResponse.body) {
        return new Response(streamingResponse.body, {
          status: 200,
          headers: {
            "Content-Type": streamingResponse.headers.get("content-type") ?? "text/event-stream",
          },
        });
      }

      const errorBody = await streamingResponse.text();
      console.error("[AI_CHAT_STREAM_ERROR_RESPONSE]", streamingResponse.status, errorBody);
    } catch (error) {
      streamingTimeout.clearTimeout();

      const abortResponse = handleAbortError(error);
      if (abortResponse) return abortResponse;

      console.error("[AI_CHAT_STREAM_ERROR]", error);
    }

    const bufferedTimeout = startOpenAITimeout();

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
        }),
        signal: bufferedTimeout.controller.signal,
      });

      bufferedTimeout.clearTimeout();

      if (!response.ok) {
        return mapOpenAIError(response.status, await response.text());
      }

      const completion = (await response.json()) as {
        choices?: { message?: ChatMessage }[];
      };

      const reply = completion.choices?.[0]?.message;

      if (!reply) {
        return NextResponse.json(
          { error: "No response from model" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: reply,
      });
    } catch (error) {
      bufferedTimeout.clearTimeout();

      const abortResponse = handleAbortError(error);
      if (abortResponse) return abortResponse;

      console.error("[AI_CHAT_ERROR]", error);
      return NextResponse.json(
        { error: "Something went wrong talking to OpenAI" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[AI_CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong talking to OpenAI" },
      { status: 500 }
    );
  }
}
