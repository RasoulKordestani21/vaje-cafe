"use client";

import React, { useState, useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface BranchSelectorProps {
  selectedBranchId: string | null;
  onBranchChange: (branchId: string | null) => void;
  isDark?: boolean;
}

export default function BranchSelector({
  selectedBranchId,
  onBranchChange,
  isDark = true
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          const activeBranches = data.filter((b: Branch) => b.isActive);
          setBranches(activeBranches);
          
          // Auto-select first branch if none selected
          if (!selectedBranchId && activeBranches.length > 0) {
            onBranchChange(activeBranches[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [selectedBranchId, onBranchChange]);

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  if (loading) {
    return (
      <div className={`px-4 py-2 rounded-lg ${isDark ? "bg-neutral-800" : "bg-gray-100"}`}>
        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          در حال بارگذاری...
        </span>
      </div>
    );
  }

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          isDark
            ? "bg-neutral-800 border-white/10 hover:bg-neutral-700 text-white"
            : "bg-white border-gray-300 hover:bg-gray-50 text-gray-900"
        }`}
      >
        <Building2 size={18} />
        <span className="font-medium">
          {selectedBranch?.name || "انتخاب شعبه"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute top-full left-0 mt-2 w-64 rounded-lg border shadow-lg z-20 ${
              isDark
                ? "bg-neutral-800 border-white/10"
                : "bg-white border-gray-300"
            }`}
          >
            <div className="p-2">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => {
                    onBranchChange(branch.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right px-4 py-2 rounded-lg transition-colors ${
                    selectedBranchId === branch.id
                      ? isDark
                        ? "bg-coffee-600 text-white"
                        : "bg-coffee-100 text-coffee-900"
                      : isDark
                      ? "hover:bg-neutral-700 text-gray-300"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-medium">{branch.name}</div>
                  {branch.address && (
                    <div className={`text-xs mt-1 ${
                      selectedBranchId === branch.id
                        ? "opacity-90"
                        : isDark
                        ? "text-gray-500"
                        : "text-gray-500"
                    }`}>
                      {branch.address}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}




