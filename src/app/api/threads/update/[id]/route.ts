import { runThreads } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return runThreads("update", req, (await ctx.params).id);
}
