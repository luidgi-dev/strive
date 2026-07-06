import { ImageResponse } from "next/og";

// Site-wide social preview. Placed at the app root so Next attaches it to every
// route's OpenGraph/Twitter metadata automatically. Kept deliberately minimal
// (quiet-luxury): dark canvas, wordmark, tagline, a single momentum-green mark.
// Satori has no oklch support, so brand tokens are inlined as hex here.
export const alt = "Strive, a calm habit tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACKGROUND = "#181b1c"; // --background (dark)
const FOREGROUND = "#d6dadb"; // --foreground (dark)
const MUTED = "#8a9193"; // --muted-foreground (dark)
const MOMENTUM = "#4ca07c"; // --momentum accent

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
          color: FOREGROUND,
        }}
      >
        <div
          style={{
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          Strive
        </div>
        <div
          style={{
            marginTop: 12,
            width: 72,
            height: 4,
            borderRadius: 2,
            background: MOMENTUM,
          }}
        />
        <div
          style={{
            marginTop: 36,
            fontSize: 40,
            color: MUTED,
          }}
        >
          Consistency over intensity.
        </div>
      </div>
    ),
    size,
  );
}
