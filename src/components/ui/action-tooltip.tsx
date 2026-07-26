import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionTooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export function ActionTooltip({ 
  children, 
  content, 
  side = "top", 
  align = "center",
  delayDuration = 300
}: ActionTooltipProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} align={align} className="max-w-xs text-center p-2.5 z-[100]">
        <p className="text-xs font-medium leading-relaxed">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
