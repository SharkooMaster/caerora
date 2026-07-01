import Image, { type ImageProps } from "next/image";
import { isUnsplash } from "@/lib/images";

// Thin wrapper over next/image that serves remote CDN photography (Unsplash)
// unoptimized, so the browser loads it directly from the fast CDN rather than
// proxying through our self-hosted optimizer. Local/backend media keeps the
// default optimized path.
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const unoptimized = props.unoptimized ?? isUnsplash(src);
  return <Image {...props} unoptimized={unoptimized} />;
}
