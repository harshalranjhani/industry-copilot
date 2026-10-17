import { readModelCatalog } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The models a conversation may use and the default, for the header's model picker. */
export function GET(): Response {
  try {
    return Response.json(readModelCatalog());
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
