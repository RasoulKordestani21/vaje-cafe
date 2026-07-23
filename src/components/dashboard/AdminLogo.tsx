"use client";

import React, { useEffect, useState } from "react";
import { LOGO_URL } from "@/constants";
import { cn } from "@/lib/utils";

interface AdminLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  rounded?: "lg" | "full";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-10 h-10"
} as const;

const AdminLogo: React.FC<AdminLogoProps> = ({
  size = "md",
  className,
  rounded = "lg"
}) => {
  const [logoUrl, setLogoUrl] = useState(LOGO_URL);

  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(data => {
        if (data.settings?.logo_url) setLogoUrl(data.settings.logo_url);
      })
      .catch(() => {});
  }, []);

  return (
    <div
      className={cn(
        sizeClasses[size],
        "shrink-0 overflow-hidden bg-white ring-1 ring-black/5",
        rounded === "full" ? "rounded-full" : "rounded-lg",
        className
      )}
    >
      <img
        src={logoUrl}
        alt="لوگوی کافه"
        className="block h-full w-full object-cover"
        draggable={false}
        onError={e => {
          (e.target as HTMLImageElement).src = LOGO_URL;
        }}
      />
    </div>
  );
};

export default AdminLogo;
