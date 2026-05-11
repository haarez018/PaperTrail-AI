"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoryCard, Story } from "@/components/StoryCard";

interface StoriesCarouselProps {
  stories: Story[];
}

/**
 * Horizontally scrollable compact story cards with prev/next buttons.
 * Used on the landing page to showcase anonymised success stories.
 */
export function StoriesCarousel({ stories }: StoriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const SCROLL_AMT = 320;

  const updateScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * SCROLL_AMT, behavior: "smooth" });
    setTimeout(updateScroll, 350);
  };

  return (
    <div className="relative">
      {/* Left button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-1)}
          className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-paper-dark bg-surface shadow-card hover:border-saffron/40 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} className="text-text-muted" />
        </button>
      )}

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        onScroll={updateScroll}
        className="flex gap-4 overflow-x-auto scrollbar-none pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {stories.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="shrink-0 w-[300px]"
          >
            <StoryCard story={story} compact index={i} />
          </motion.div>
        ))}
      </div>

      {/* Right button */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy(1)}
          className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-paper-dark bg-surface shadow-card hover:border-saffron/40 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      )}
    </div>
  );
}
