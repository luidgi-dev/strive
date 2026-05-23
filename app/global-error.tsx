"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for crashes in the root layout itself. It replaces
 * `<html>/<body>`, so the design-system stylesheet, fonts, theme provider and
 * i18n are NOT available here — hence the self-contained, English-only markup
 * with inline colors mirroring the Strive palette (light + dark via media
 * query). Every other error is handled by the styled, localized
 * `(app)/error.tsx`. Keep this rare path simple and on-brand.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] root layout error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "oklch(0.98 0.004 200)",
          color: "oklch(0.28 0.005 200)",
        }}
      >
        <style>{`
          @media (prefers-color-scheme: dark) {
            body { background: oklch(0.18 0.006 200) !important; color: oklch(0.86 0.006 200) !important; }
            .ge-muted { color: oklch(0.62 0.01 200) !important; }
            .ge-retry { background: oklch(0.88 0.008 200) !important; color: oklch(0.18 0.006 200) !important; }
          }
        `}</style>
        <main
          style={{
            maxWidth: 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Something went wrong.
          </h1>
          <p
            className="ge-muted"
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.55,
              color: "oklch(0.55 0.01 200)",
            }}
          >
            Strive hit an unexpected error. Try reloading the page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="ge-retry"
            style={{
              marginTop: 8,
              minHeight: 44,
              padding: "0 20px",
              border: 0,
              borderRadius: 999,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background: "oklch(0.20 0.005 200)",
              color: "oklch(0.985 0 0)",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
