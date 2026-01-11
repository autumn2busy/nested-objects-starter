import { NextResponse } from "next/server";

const OPENAI_TIMEOUT_MS = 30_000;

type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
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

  const { role, content, tool_calls } = message as Partial<ChatMessage>;

  return (
    (role === "system" || role === "user" || role === "assistant" || role === "tool") &&
    typeof content === "string" &&
    content.length > 0 &&
    (tool_calls === undefined || Array.isArray(tool_calls))
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

    // Inject System Prompt
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are the AI Concierge for "Nested Objects", a private professional hub for field inspectors, notaries, and gig workers.
      
      Your goal is to help members find work, understand their tools, and navigate the platform.
      
      Key Context:
      - The "Directory" contains firms hiring for field work (inspections, BPOs, etc).
      - "Tools" includes an AI Resume Builder, Job Tracker, and Routing tool.
      - Plans: Starter (Free), Pro ($19/mo), Elite ($49/mo), Agency ($199/mo).
      - If asked about "how to get work", direct them to the Directory to find firms.
      
      Tone: Professional, encouraging, and concise. Do not hallucinate specific firm names unless they are provided in the conversation context.`
    };

    // MOCK_AI Support for testing without credits
    if (process.env.MOCK_AI === 'true' || process.env.NEXT_PUBLIC_MOCK_AI === 'true') {
      const mockResponse = "This is a simulated response from the AI Concierge (Mock Mode). I can help you find firms in the Directory or use the tools. [Test Data]"
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          // Simulate network delay
          await new Promise(r => setTimeout(r, 500))

          // Stream chunks
          const chunks = mockResponse.split(' ')
          for (const chunk of chunks) {
            const data = {
              choices: [{ delta: { content: chunk + ' ' } }]
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            await new Promise(r => setTimeout(r, 100))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    const streamingPayload = {
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
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
