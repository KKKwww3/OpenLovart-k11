import { corsHeaders } from "../_shared/auth.ts";

export interface SseStream {
  readable: ReadableStream;
  writeSse: (event: string, data: string) => Promise<void>;
  close: () => Promise<void>;
}

export function createSseStream(): SseStream {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const writeSse = async (event: string, data: string) => {
    await writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
    await writer.ready;
  };

  const close = async () => {
    await writer.close();
  };

  return { readable, writeSse, close };
}

export function createSseResponse(readable: ReadableStream): Response {
  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}