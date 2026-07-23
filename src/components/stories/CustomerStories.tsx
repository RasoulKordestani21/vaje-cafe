"use client";

import React, { useEffect, useState } from "react";
import StoryAvatar from "@/components/stories/StoryAvatar";
import StoryViewer from "@/components/stories/StoryViewer";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  image_url: string;
  caption: string | null;
  duration: number;
}

interface CustomerStoriesProps {
  isDark?: boolean;
  className?: string;
}

const CustomerStories: React.FC<CustomerStoriesProps> = ({
  isDark = false,
  className
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  useEffect(() => {
    fetch("/api/stories")
      .then(r => r.json())
      .then(data => {
        if (data.stories?.length) setStories(data.stories);
      })
      .catch(() => {});
  }, []);

  if (stories.length === 0) return null;

  const openStory = (index: number) => {
    setInitialIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <section
        dir="ltr"
        className={cn(
          "border-b",
          isDark ? "border-[#2c3329] bg-[#141a12]" : "border-[#e5e0d8] bg-white",
          className
        )}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {stories.map((story, index) => (
              <button
                key={story.id}
                type="button"
                onClick={() => openStory(index)}
                className="group flex shrink-0 cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0"
                aria-label={story.caption || `استوری ${index + 1}`}
              >
                <StoryAvatar
                  src={story.image_url}
                  alt={story.caption || `استوری ${index + 1}`}
                  size="md"
                  ringOnly
                />
                <span
                  className={cn(
                    "max-w-[72px] truncate text-center text-[11px]",
                    isDark ? "text-[#8fa688]" : "text-[#4b5563]"
                  )}
                >
                  {story.caption?.trim() || `استوری ${index + 1}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {viewerOpen && (
        <StoryViewer
          stories={stories}
          initialIndex={initialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
};

export default CustomerStories;
