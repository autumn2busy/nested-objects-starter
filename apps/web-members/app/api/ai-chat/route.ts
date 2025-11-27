import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("application/json")) {
      console.warn("[AI_CHAT_VALIDATION]", {
        reason: "invalid_content_type",
        contentType,
      });
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await req.json().catch((error: unknown) => {
      console.warn("[AI_CHAT_VALIDATION]", {
        reason: "invalid_json",
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    });

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

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
      console.warn("[AI_CHAT_VALIDATION]", {
        reason: "missing_messages",
        hasMessages: Boolean(messages),
        isArray: Array.isArray(messages),
        length: messages?.length,
      });
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const invalidMessageIndex = messages.findIndex((message) => !isValidMessage(message));
    if (invalidMessageIndex !== -1) {
      console.warn("[AI_CHAT_VALIDATION]", {
        reason: "invalid_message",
        index: invalidMessageIndex,
      });
      return NextResponse.json(
        { error: `messages[${invalidMessageIndex}] is invalid` },
        { status: 400 }
      );
    }

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
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[AI_CHAT_ERROR_RESPONSE]", response.status, errorBody);
      return NextResponse.json(
        { error: "Failed to get a response from OpenAI" },
        { status: 502 },
      );
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
    console.error("[AI_CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong talking to OpenAI" },
      { status: 500 }
    );
  }
}
