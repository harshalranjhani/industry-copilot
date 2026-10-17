import "server-only";
import { createThreadsHandler } from "@/lib/chat/threads-handler";
import { readDefaultModelId } from "@/lib/config";
import { getRuntime } from "@/lib/runtime";

type Handlers = ReturnType<typeof createThreadsHandler>;
type Method = keyof Handlers;

/** Runs one thread endpoint, turning a missing data store into a JSON error instead of a crash. */
export async function runThreads(method: Method, req: Request, id?: string): Promise<Response> {
  let handlers: Handlers;
  try {
    const { conversations, fleet } = getRuntime();
    handlers = createThreadsHandler({ conversations, findUser: (userId) => fleet.findUser(userId), modelId: readDefaultModelId() });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
  return method === "list" || method === "create" ? handlers[method](req) : handlers[method](req, id ?? "");
}
