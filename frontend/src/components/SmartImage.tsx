import Image, { type ImageProps } from "next/image";
import { isUnsplash } from "@/lib/images";

// localhost media is only reachable from the host browser, not from inside
// the frontend container where the optimizer runs (local docker compose only;
// prod media URLs use the public domain).
function isLocalhostMedia(src: string): boolean {
  return src.startsWith("http://localhost") || src.startsWith("http://127.0.0.1");
}

// Thin wrapper over next/image that serves remote CDN photography (Unsplash)
// unoptimized, so the browser loads it directly from the fast CDN rather than
// proxying through our self-hosted optimizer. Local/backend media keeps the
// default optimized path.
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const unoptimized = props.unoptimized ?? (isUnsplash(src) || isLocalhostMedia(src));
  return <Image {...props} unoptimized={unoptimized} />;
}
