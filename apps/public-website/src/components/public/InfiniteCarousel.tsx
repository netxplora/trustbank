import React, { useEffect, useRef, useState } from "react";

interface InfiniteCarouselProps {
  children: React.ReactNode;
  speed?: number; // Pixels per frame (approx) -> repurposed to duration
  direction?: "left" | "right";
  pauseOnHover?: boolean;
}

export const InfiniteCarousel = ({
  children,
  speed = 1,
  direction = "left",
  pauseOnHover = true,
}: InfiniteCarouselProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Approximate speed conversion: speed 1 = 40s duration
  const duration = 40 / speed;

  return (
    <div
      className="w-full overflow-hidden whitespace-nowrap mask-edges relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
      }}
    >
      <div
        className="flex w-max gap-6 py-4 animate-infinite-scroll hover:pause-animation"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationPlayState: pauseOnHover && isHovered ? "paused" : "running",
          // The total width is exactly 2x the children width + 1 gap.
          // By animating -50%, it moves exactly one set of children + half a gap.
          // Wait, Tailwind doesn't have animate-infinite-scroll by default. We'll inline the keyframes.
        }}
      >
        <style>
          {`
            @keyframes infinite-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-50% - 0.75rem)); } /* 0.75rem is half of gap-6 (1.5rem) */
            }
            .animate-infinite-scroll {
              animation: infinite-scroll linear infinite;
            }
          `}
        </style>
        {/* Set 1 */}
        <div className="flex items-stretch gap-6 h-full">
          {children}
        </div>
        {/* Set 2 */}
        <div className="flex items-stretch gap-6 h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
