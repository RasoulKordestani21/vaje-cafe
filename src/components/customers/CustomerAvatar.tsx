"use client";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomerAvatarProps = {
  profilePicture?: string | null;
  name?: string | null;
  phone?: string | null;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { box: "w-8 h-8", text: "text-xs", icon: 14 },
  md: { box: "w-11 h-11", text: "text-sm", icon: 18 },
  lg: { box: "w-14 h-14", text: "text-base", icon: 22 }
};

function getInitial(name?: string | null, phone?: string | null) {
  const label = name?.trim() || phone?.trim() || "م";
  return label.charAt(0);
}

export default function CustomerAvatar({
  profilePicture,
  name,
  phone,
  size = "sm",
  isDark = false,
  className
}: CustomerAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const dims = sizeMap[size];
  const initial = getInitial(name, phone);
  const showImage = profilePicture && !imgFailed;

  useEffect(() => {
    setImgFailed(false);
  }, [profilePicture]);

  if (showImage) {
    return (
      <img
        src={profilePicture}
        alt={name || phone || "مشتری"}
        onError={() => setImgFailed(true)}
        className={cn(
          dims.box,
          "rounded-full object-cover shrink-0 border-2",
          isDark ? "border-white/10" : "border-admin-border",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        dims.box,
        "rounded-full shrink-0 flex items-center justify-center font-bold border",
        dims.text,
        isDark
          ? "bg-coffee-500/15 text-coffee-400 border-coffee-500/25"
          : "bg-coffee-50 text-coffee-600 border-coffee-200",
        className
      )}
      aria-hidden
    >
      {initial !== "م" ? (
        initial
      ) : (
        <User size={dims.icon} strokeWidth={2} />
      )}
    </div>
  );
}
