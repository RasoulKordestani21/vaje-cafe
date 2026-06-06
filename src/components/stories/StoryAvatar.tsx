"use client";

import React from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-12",
  md: "size-[72px]",
  lg: "size-20",
} as const;

/** Force true circles — bypasses theme --radius-full which may be a small rem value */
const circle = "rounded-[50%]";

/** Inset for the dark gap + image, scaled per avatar size */
const insetClasses = {
  sm: "inset-[2px]",
  md: "inset-[3px]",
  lg: "inset-[3px]",
} as const;

const imageInsetClasses = {
  sm: "inset-[4px]",
  md: "inset-[5px]",
  lg: "inset-[5px]",
} as const;

interface StoryAvatarProps {
  src: string;
  alt: string;
  size?: keyof typeof sizeClasses;
  label?: string;
  onClick?: () => void;
  ringOnly?: boolean;
  className?: string;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const StoryAvatar: React.FC<StoryAvatarProps> = ({
  src,
  alt,
  size = "md",
  label,
  onClick,
  ringOnly = false,
  className,
  onImageError,
}) => {
  const ring = (
    <div
      className={cn(
        sizeClasses[size],
        circle,
        "relative shrink-0 overflow-hidden",
        "transition-transform duration-200 group-hover:scale-105",
        className
      )}
    >
      {/* Gradient ring — absolute layers on a fixed square = guaranteed circle */}
      <div
        className={cn("absolute inset-0 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500", circle)}
        aria-hidden
      />
      <div
        className={cn("absolute bg-neutral-950", circle, insetClasses[size])}
        aria-hidden
      />
      <div
        className={cn(
          "absolute overflow-hidden bg-neutral-900",
          circle,
          imageInsetClasses[size]
        )}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="block size-full object-cover"
          onError={onImageError}
        />
      </div>
    </div>
  );

  if (ringOnly) {
    return ring;
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex shrink-0 cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0"
        aria-label={label || alt}
      >
        {ring}
        {label && (
          <span className="max-w-[80px] truncate text-center text-xs text-white">
            {label}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="group flex shrink-0 flex-col items-center gap-2">
      {ring}
      {label && (
        <span className="max-w-[80px] truncate text-center text-xs text-white">
          {label}
        </span>
      )}
    </div>
  );
};

export default StoryAvatar;
