"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AppShell({
  analytics,
  header,
  footer,
  overlays,
  children,
}: {
  analytics: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  overlays: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The /studio admin panel renders its own full-screen chrome.
  if (pathname?.startsWith("/studio")) {
    return <>{children}</>;
  }
  return (
    <>
      {analytics}
      {header}
      <main className="min-h-[70vh]">{children}</main>
      {footer}
      {overlays}
    </>
  );
}
