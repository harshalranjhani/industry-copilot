import { runThreads } from "@/lib/threads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = (req: Request) => runThreads("create", req);
