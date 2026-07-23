import { useMemo } from "react";
import { encode } from "uqr";

interface QRCodeProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  id?: string;
  className?: string;
}

/**
 * Pure ESM QR Code component using `uqr`.
 * Renders an inline SVG — no CJS `require()` calls, fully Vite 8 compatible.
 */
export default function QRCode({ value, size = 160, level = "M", id, className }: QRCodeProps) {
  const svgPath = useMemo(() => {
    if (!value) return "";
    const { data } = encode(value, { ecc: level });
    const moduleCount = data.length;
    let path = "";
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (data[row][col]) {
          path += `M${col},${row}h1v1h-1z`;
        }
      }
    }
    return path;
  }, [value, level]);

  if (!value) return null;

  const { data } = encode(value, { ecc: level });
  const moduleCount = data.length;

  return (
    <svg
      id={id}
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${moduleCount} ${moduleCount}`}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <rect width={moduleCount} height={moduleCount} fill="white" />
      <path d={svgPath} fill="black" />
    </svg>
  );
}
