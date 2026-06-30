"use client";
import { useEffect } from "react";
import { track } from "@/lib/tracker";

// Fires a view_item_list event once on mount (used to compute CTR).
export function ProductListTracker({ list = "default" }: { list?: string }) {
  useEffect(() => {
    track({ event_type: "view_item_list", meta: { list } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
