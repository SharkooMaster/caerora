"use client";
import { useEffect } from "react";
import { track } from "@/lib/tracker";

/** Fires a first-party + ad-platform search event when results render. */
export function SearchTracker({ query, results }: { query: string; results: number }) {
  useEffect(() => {
    if (!query) return;
    track({ event_type: "search", meta: { search_term: query, results } });
  }, [query, results]);
  return null;
}
