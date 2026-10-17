import { runThreads } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (req: Request) => runThreads("list", req);
