import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";
export const alt = "PoolNym - Návštěvnost bazénu Nymburk";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #0ea5e9, #0284c7)",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "50%",
            width: 120,
            height: 120,
            fontSize: 60,
            fontWeight: 800,
          }}
        >
          P
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            marginBottom: 20,
            letterSpacing: -2,
          }}
        >
          PoolNym
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 500,
            opacity: 0.9,
          }}
        >
          Návštěvnost bazénu Nymburk
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
