import { runThreads } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return runThreads("remove", req, (await ctx.params).id);
}
