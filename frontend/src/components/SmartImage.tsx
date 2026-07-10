import Image, { type ImageProps } from "next/image";
import { isUnsplash } from "@/lib/images";

// localhost media is only reachable from the host browser, not from inside
// the frontend container where the optimizer runs (local docker compose only;
// prod media URLs use the public domain).
function isLocalhostMedia(src: string): boolean {
  return src.startsWith("http://localhost") || src.startsWith("http://127.0.0.1");
}

// Thin wrapper over next/image that serves remote CDN photography and our
// pre-compressed static brand art unoptimized, so they bypass the self-hosted
// optimizer (which needs sharp in standalone mode). Backend media keeps the
// default optimized path.
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const isStaticAsset = src.startsWith("/");
  const unoptimized = props.unoptimized ?? (isUnsplash(src) || isLocalhostMedia(src) || isStaticAsset);
  return <Image {...props} unoptimized={unoptimized} />;
}
