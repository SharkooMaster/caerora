"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SmartImage } from "./SmartImage";
import { isUnsplash } from "@/lib/images";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ZoomInIcon } from "./icons";

const SWIPE_THRESHOLD = 45;

/**
 * PDP gallery: swipe between images on touch, arrows on desktop, click the
 * image to open a full-screen lightbox with zoom (click/tap to magnify, move
 * to pan). No dependencies.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const count = images.length;
  const index = Math.min(active, Math.max(count - 1, 0));

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

  const current = images[index];

  return (
    <div>
      {/* Main image: swipe on touch, arrows on hover, click to enlarge */}
      <div
        className={`group relative aspect-[4/5] w-full touch-pan-y select-none overflow-hidden rounded-2xl shadow-card ${
          isUnsplash(current) ? "bg-cream" : "bg-white"
        }`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current ? (
          <button
            onClick={openLightbox}
            aria-label="Enlarge image"
            className="absolute inset-0 h-full w-full cursor-zoom-in"
          >
            <SmartImage
              src={current}
              alt={alt}
              fill
              priority
              className={isUnsplash(current) ? "object-cover" : "object-contain p-6"}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-3xl text-rose">
            Caerora
          </div>
        )}

        {/* Zoom hint */}
        {current && (
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
            {images.map((_, i) => (
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
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => goTo(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-md border bg-white ${
                i === index ? "border-rose" : "border-taupe/20"
              }`}
            >
              <SmartImage
                src={img}
                alt=""
                fill
                className={isUnsplash(img) ? "object-cover" : "object-contain p-1"}
                sizes="64px"
              />
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
                src={current}
                alt={alt}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>

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
              {zoomed ? "Move to pan \u00b7 tap to reset" : "Tap image to zoom"}
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
