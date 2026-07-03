import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Purge the ISR page cache. Called by the backend whenever staff change
 * catalog/content in Studio, so edits show on the storefront immediately
 * instead of after the revalidate window.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }
  // Layout-scoped: invalidates every page. The site is small, so a full
  // re-render on next request is cheaper than tracking exact paths.
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true });
}
