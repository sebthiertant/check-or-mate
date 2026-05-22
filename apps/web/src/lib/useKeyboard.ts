"use client";

import { useEffect } from "react";

interface KeyboardOptions {
  totalMoves: number;
  moveIdx: number;
  onMoveIdx: (idx: number) => void;
  onFlip: () => void;
  onCloseFullscreen: () => void;
  isFullscreen: boolean;
}

export function useKeyboard({
  totalMoves,
  moveIdx,
  onMoveIdx,
  onFlip,
  onCloseFullscreen,
  isFullscreen,
}: KeyboardOptions) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onMoveIdx(Math.max(0, moveIdx - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          onMoveIdx(Math.min(totalMoves, moveIdx + 1));
          break;
        case "Home":
          e.preventDefault();
          onMoveIdx(0);
          break;
        case "End":
          e.preventDefault();
          onMoveIdx(totalMoves);
          break;
        case "f":
        case "F":
          onFlip();
          break;
        case "Escape":
          if (isFullscreen) onCloseFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalMoves, moveIdx, onMoveIdx, onFlip, onCloseFullscreen, isFullscreen]);
}
