"use client";

import React, { useState, useEffect } from "react";
import { Star, Quote, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJalaliDate } from "@/utils/jalaliDateUtils";
import { timestampToJalali } from "@/utils/jalaliDateUtils";
import ExperienceComments from "./ExperienceComments";

interface ExperienceComment {
  id: string;
  comment_text: string;
  rating: number;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
}

const ExperienceCommentsDisplay: React.FC = () => {
  const [comments, setComments] = useState<ExperienceComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await fetch("/api/experience-comments?approved_only=true&limit=6");
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching experience comments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <section className="py-24 dark:bg-neutral-950 bg-primary-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 font-black">
            تجربه مشتریان
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            نظرات و تجربیات واقعی مشتریان ما از کافه واژه
          </p>
        </div>

        {/* Comments Grid */}
        {comments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 hover:border-coffee-500/30 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-coffee-900/30 rounded-full flex items-center justify-center text-coffee-400 flex-shrink-0">
                    <Quote size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <Star
                          key={starValue}
                          size={14}
                          fill={comment.rating >= starValue ? "currentColor" : "none"}
                          className={cn(
                            comment.rating >= starValue ? "text-yellow-400" : "text-gray-600"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-400">
                      {comment.customer_name || comment.customer_phone || "مشتری"}
                    </p>
                  </div>
                </div>

                <p className="text-gray-300 leading-7 mb-4 line-clamp-4">
                  {comment.comment_text}
                </p>

                <div className="pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">
                    {formatJalaliDate(timestampToJalali(parseInt(comment.created_at)))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Submission Form */}
        <div className="max-w-2xl mx-auto">
          <ExperienceComments isDark={true} />
        </div>
      </div>
    </section>
  );
};

export default ExperienceCommentsDisplay;



