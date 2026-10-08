import { useEffect, RefObject } from "react";

export const useAutoScroll = (ref: RefObject<HTMLDivElement | null>, speed: number = 0.5) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let animationFrameId: number;
    let isPaused = false;
    let scrollDirection = 1;

    const scroll = () => {
      if (!el || isPaused) {
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      // Check if we actually need to scroll
      if (el.scrollHeight <= el.clientHeight) {
        animationFrameId = requestAnimationFrame(scroll);
        return;
      }

      el.scrollTop += speed * scrollDirection;

      // Hit bottom
      if (scrollDirection === 1 && el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        isPaused = true;
        setTimeout(() => {
          scrollDirection = -1;
          isPaused = false;
        }, 3000); // Pause at bottom for 3 seconds
      }
      // Hit top
      else if (scrollDirection === -1 && el.scrollTop <= 0) {
        isPaused = true;
        setTimeout(() => {
          scrollDirection = 1;
          isPaused = false;
        }, 3000); // Pause at top for 3 seconds
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    // Initial pause before scrolling starts
    setTimeout(() => {
      animationFrameId = requestAnimationFrame(scroll);
    }, 2000);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [ref, speed]);
};
