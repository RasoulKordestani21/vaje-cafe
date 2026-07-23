"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  duration: number;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const currentIndexRef = useRef(currentIndex);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.duration || 20;

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx < stories.length - 1) {
      setCurrentIndex(idx + 1);
    } else {
      onClose();
    }
  }, [stories.length, onClose]);

  const handlePrev = useCallback(() => {
    const idx = currentIndexRef.current;
    if (idx > 0) {
      setCurrentIndex(idx - 1);
    } else {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!currentStory) return;

    setProgress(0);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleNext();
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentStory, duration, handleNext]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      handlePrev();
    } else if (x > (width * 2) / 3) {
      handleNext();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNext, handlePrev, onClose]);

  if (!currentStory) {
    onClose();
    return null;
  }

  const slideOffset = stories.length > 0 ? (currentIndex / stories.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={handleClick}
      dir="ltr"
    >
      {/* Progress bars — left to right */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
        {stories.map((_, index) => (
          <div
            key={index}
            className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className={cn(
                "h-full bg-white transition-[width] duration-100 ease-linear",
                index < currentIndex && "w-full",
                index > currentIndex && "w-0"
              )}
              style={{
                width:
                  index === currentIndex
                    ? `${progress}%`
                    : index < currentIndex
                      ? "100%"
                      : "0%"
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20"
        aria-label="بستن"
      >
        <X size={32} />
      </button>

      {/* Sliding story track */}
      <div className="relative w-full max-w-md h-full overflow-hidden mx-auto">
        <div
          className="flex h-full transition-transform duration-300 ease-out will-change-transform"
          style={{
            width: `${stories.length * 100}%`,
            transform: `translateX(-${slideOffset}%)`
          }}
        >
          {stories.map(story => (
            <div
              key={story.id}
              className="flex h-full items-center justify-center px-2"
              style={{ width: `${100 / stories.length}%` }}
            >
              <img
                src={story.image_url}
                alt={story.caption || ""}
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {currentStory.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10 pointer-events-none">
          <p className="text-white text-lg text-center">{currentStory.caption}</p>
        </div>
      )}

      <div className="absolute top-16 left-4 text-white/70 text-sm z-20">
        {currentIndex + 1} / {stories.length}
      </div>
    </div>
  );
};

export default StoryViewer;
