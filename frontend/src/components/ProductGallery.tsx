"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SmartImage } from "./SmartImage";
import { isUnsplash } from "@/lib/images";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ZoomInIcon } from "./icons";

const SWIPE_THRESHOLD = 45;

export interface GalleryMedia {
  type: "image" | "video";
  src: string;
  /** Poster image for video slides. */
  poster?: string | null;
}

function PlayBadge({ size = "h-12 w-12" }: { size?: string }) {
  return (
    <span
      className={`pointer-events-none absolute left-1/2 top-1/2 flex ${size} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/60 text-ivory backdrop-blur-sm`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-1/2 w-1/2">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

/**
 * PDP gallery: swipe between images on touch, arrows on desktop, click an
 * image to open a full-screen lightbox with zoom (click/tap to magnify, move
 * to pan). Video slides play inline with native controls. No dependencies.
 */
export function ProductGallery({
  media,
  alt,
  jumpTo,
}: {
  media: GalleryMedia[];
  alt: string;
  /** When set (e.g. on variant selection), the gallery scrolls to this index.
   * A fresh object identity re-triggers the jump even for the same index. */
  jumpTo?: { index: number } | null;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const count = media.length;
  const index = Math.min(active, Math.max(count - 1, 0));

  useEffect(() => {
    if (jumpTo && jumpTo.index >= 0 && jumpTo.index < count) {
      setActive(jumpTo.index);
      setZoomed(false);
    }
  }, [jumpTo, count]);

  const goTo = useCallback(
    (i: number) => {
      if (count < 2) return;
      setActive(((i % count) + count) % count);
      setZoomed(false);
    },
    [count],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  function openLightbox() {
    setZoomed(false);
    setLightbox(true);
  }
  const closeLightbox = useCallback(() => {
    setLightbox(false);
    setZoomed(false);
  }, []);

  // Lightbox: lock scroll + keyboard navigation.
  useEffect(() => {
    if (!lightbox) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, closeLightbox, next, prev]);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  }

  function pointFrom(e: React.MouseEvent | React.Touch, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }

  function toggleZoom(e: React.MouseEvent<HTMLDivElement>) {
    if (zoomed) {
      setZoomed(false);
    } else {
      setOrigin(pointFrom(e, e.currentTarget));
      setZoomed(true);
    }
  }

  function panMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (zoomed) setOrigin(pointFrom(e, e.currentTarget));
  }

  function panTouch(e: React.TouchEvent<HTMLDivElement>) {
    if (zoomed && e.touches.length === 1) {
      setOrigin(pointFrom(e.touches[0], e.currentTarget));
    }
  }

  const current = media[index];
  const isVideo = current?.type === "video";

  return (
    <div>
      {/* Main slide: swipe on touch, arrows on hover, click image to enlarge */}
      <div
        className={`group relative aspect-[4/5] w-full touch-pan-y select-none overflow-hidden rounded-2xl shadow-card ${
          current && isUnsplash(current.src) ? "bg-cream" : "bg-white"
        }`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current && isVideo ? (
          <video
            key={current.src}
            src={current.src}
            poster={current.poster || undefined}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full bg-espresso object-contain"
          />
        ) : current ? (
          <button
            onClick={openLightbox}
            aria-label="Enlarge image"
            className="absolute inset-0 h-full w-full cursor-zoom-in"
          >
            <SmartImage
              src={current.src}
              alt={alt}
              fill
              priority
              className={isUnsplash(current.src) ? "object-cover" : "object-contain p-6"}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-3xl text-rose">
            Caerora
          </div>
        )}

        {/* Zoom hint */}
        {current && !isVideo && (
          <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 p-2 text-espresso shadow-card backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <ZoomInIcon />
          </span>
        )}

        {/* Desktop arrows */}
        {count > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 p-2.5 text-espresso shadow-card backdrop-blur transition hover:bg-ivory md:flex md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 p-2.5 text-espresso shadow-card backdrop-blur transition hover:bg-ivory md:flex md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}

        {/* Mobile position dots */}
        {count > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {media.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-espresso" : "w-1.5 bg-espresso/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={m.src}
              onClick={() => goTo(i)}
              aria-label={m.type === "video" ? `Play video ${i + 1}` : `View image ${i + 1}`}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-md border bg-white ${
                i === index ? "border-rose" : "border-taupe/20"
              }`}
            >
              {m.type === "video" && !m.poster ? (
                <span className="absolute inset-0 bg-espresso/80" />
              ) : (
                <SmartImage
                  src={m.type === "video" ? (m.poster as string) : m.src}
                  alt=""
                  fill
                  className={isUnsplash(m.src) ? "object-cover" : "object-contain p-1"}
                  sizes="64px"
                />
              )}
              {m.type === "video" && <PlayBadge size="h-7 w-7" />}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && current && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-espresso/95 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — image viewer`}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 text-ivory sm:px-6">
            <span className="text-xs uppercase tracking-widest text-ivory/70">
              {count > 1 ? `${index + 1} / ${count}` : ""}
            </span>
            <button
              onClick={closeLightbox}
              aria-label="Close image viewer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ivory/10 p-2.5 transition hover:bg-ivory/20"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Stage */}
          {isVideo ? (
            <div className="relative mx-auto w-full max-w-4xl flex-1 overflow-hidden">
              <video
                key={current.src}
                src={current.src}
                poster={current.poster || undefined}
                controls
                playsInline
                autoPlay
                className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain sm:inset-8 sm:h-[calc(100%-4rem)] sm:w-[calc(100%-4rem)]"
              />
            </div>
          ) : (
            <div
              className={`relative mx-auto w-full max-w-4xl flex-1 overflow-hidden ${
                zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              onClick={toggleZoom}
              onMouseMove={panMouse}
              onTouchStart={onTouchStart}
              onTouchMove={panTouch}
              onTouchEnd={(e) => {
                if (!zoomed) onTouchEnd(e);
                else touchStart.current = null;
              }}
            >
              <div
                className="absolute inset-4 transition-transform duration-200 ease-out sm:inset-8"
                style={{
                  transform: zoomed ? "scale(2.5)" : "scale(1)",
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                }}
              >
                <SmartImage
                  src={current.src}
                  alt={alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            </div>
          )}

          {/* Bottom bar: arrows + hint */}
          <div className="flex items-center justify-center gap-6 px-4 py-4 text-ivory">
            {count > 1 && (
              <button
                onClick={prev}
                aria-label="Previous image"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ivory/10 p-3 transition hover:bg-ivory/20"
              >
                <ChevronLeftIcon />
              </button>
            )}
            <span className="text-[11px] uppercase tracking-widest text-ivory/60">
              {isVideo ? "" : zoomed ? "Move to pan \u00b7 tap to reset" : "Tap image to zoom"}
            </span>
            {count > 1 && (
              <button
                onClick={next}
                aria-label="Next image"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ivory/10 p-3 transition hover:bg-ivory/20"
              >
                <ChevronRightIcon />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
