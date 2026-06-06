"use client";

import React from "react";
import { Package, Inbox, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: "package" | "inbox" | "search" | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const iconMap = {
  package: Package,
  inbox: Inbox,
  search: Search,
};

export function EmptyState({ icon = "package", title, description, action, className }: EmptyStateProps) {
  const IconComponent = typeof icon === "string" ? iconMap[icon] : null;

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      {IconComponent ? (
        <IconComponent className="h-12 w-12 text-muted-foreground mb-4" />
      ) : (
        <div className="mb-4">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

