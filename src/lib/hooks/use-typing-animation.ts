"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type UseTypingAnimationOptions = {
  speed?: number; // ms per character
  startDelay?: number; // delay before starting
  onComplete?: () => void;
};

type UseTypingAnimationReturn = {
  displayedText: string;
  isTyping: boolean;
  isComplete: boolean;
  start: (text: string) => void;
  reset: () => void;
  pause: () => void;
  resume: () => void;
};

export function useTypingAnimation({
  speed = 30,
  startDelay = 0,
  onComplete,
}: UseTypingAnimationOptions = {}): UseTypingAnimationReturn {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const fullTextRef = useRef("");
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const typeNextChar = useCallback(() => {
    if (isPaused) return;

    const fullText = fullTextRef.current;
    const currentIndex = currentIndexRef.current;

    if (currentIndex < fullText.length) {
      currentIndexRef.current++;
      setDisplayedText(fullText.slice(0, currentIndexRef.current));

      // vary speed slightly for natural feel
      const variance = Math.random() * 20 - 10;
      const nextDelay = Math.max(10, speed + variance);

      timeoutRef.current = setTimeout(typeNextChar, nextDelay);
    } else {
      setIsTyping(false);
      setIsComplete(true);
      onComplete?.();
    }
  }, [speed, isPaused, onComplete]);

  const start = useCallback(
    (text: string) => {
      clearTimer();
      fullTextRef.current = text;
      currentIndexRef.current = 0;
      setDisplayedText("");
      setIsComplete(false);
      setIsPaused(false);
      setIsTyping(true);

      if (startDelay > 0) {
        timeoutRef.current = setTimeout(typeNextChar, startDelay);
      } else {
        typeNextChar();
      }
    },
    [clearTimer, startDelay, typeNextChar]
  );

  const reset = useCallback(() => {
    clearTimer();
    fullTextRef.current = "";
    currentIndexRef.current = 0;
    setDisplayedText("");
    setIsTyping(false);
    setIsComplete(false);
    setIsPaused(false);
  }, [clearTimer]);

  const pause = useCallback(() => {
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (isPaused && !isComplete) {
      setIsPaused(false);
      typeNextChar();
    }
  }, [isPaused, isComplete, typeNextChar]);

  // cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    displayedText,
    isTyping,
    isComplete,
    start,
    reset,
    pause,
    resume,
  };
}
