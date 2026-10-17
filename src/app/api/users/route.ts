import { getRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The fleet's users, for the header's user picker. */
export function GET(): Response {
  try {
    return Response.json({ users: getRuntime().fleet.users() });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
