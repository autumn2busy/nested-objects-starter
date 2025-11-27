import { NextResponse } from "next/server";

import { toolDefinitions, toolHandlers } from "./tools";

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

function isValidMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== "object") return false;

  const { role, content } = message as Partial<ChatMessage>;

  return (
    (role === "system" || role === "user" || role === "assistant" || role === "tool") &&
    typeof content === "string" &&
    content.length > 0
  );
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

    const initial = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        tools: toolDefinitions,
        tool_choice: "auto",
      }),
    });

    if (!initial.ok) {
      const errorBody = await initial.text();
      console.error("[AI_CHAT_ERROR_RESPONSE]", initial.status, errorBody);
      return NextResponse.json(
        { error: "Failed to get a response from OpenAI" },
        { status: 502 },
      );
    }

    const firstCompletion = (await initial.json()) as {
      choices?: { message?: ChatMessage }[];
    };

    const assistantMessage = firstCompletion.choices?.[0]?.message;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 500 }
      );
    }

    const toolCalls = assistantMessage.tool_calls ?? [];

    if (!toolCalls.length) {
      return NextResponse.json({ message: assistantMessage });
    }

    const toolMessages: ChatMessage[] = [];

    for (const call of toolCalls) {
      const handler = toolHandlers[call.function.name];
      if (!handler) continue;

      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(call.function.arguments || "{}") as Record<
          string,
          unknown
        >;
      } catch (error) {
        console.warn("[AI_CHAT_TOOL_ARG_PARSE_WARNING]", error);
      }

      const result = await handler(parsedArgs);

      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: JSON.stringify(result),
      });
    }

    const followUpMessages: ChatMessage[] = [
      ...messages,
      {
        role: "assistant",
        content: assistantMessage.content ?? "",
        tool_calls: toolCalls,
      },
      ...toolMessages,
    ];

    const final = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: followUpMessages,
        tools: toolDefinitions,
        tool_choice: "auto",
      }),
    });

    if (!final.ok) {
      const errorBody = await final.text();
      console.error("[AI_CHAT_FINAL_ERROR_RESPONSE]", final.status, errorBody);
      return NextResponse.json(
        { error: "Failed to get a response from OpenAI" },
        { status: 502 }
      );
    }

    const finalCompletion = (await final.json()) as {
      choices?: { message?: ChatMessage }[];
    };

    const reply = finalCompletion.choices?.[0]?.message;

    if (!reply) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error("[AI_CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong talking to OpenAI" },
      { status: 500 }
    );
  }
}
