"use client";

import React, { useState, useEffect } from "react";
import { Star, Quote, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJalaliDate } from "@/utils/jalaliDateUtils";
import { timestampToJalali } from "@/utils/jalaliDateUtils";
import ExperienceComments from "@/components/experience/ExperienceComments";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ExperienceComment {
  id: string;
  comment_text: string;
  rating: number;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
}

export default function ExperiencePage() {
  const [comments, setComments] = useState<ExperienceComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const commentsPerPage = 12;

  useEffect(() => {
    fetchComments();
  }, [page]);

  const fetchComments = async (resetPage: boolean = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      const response = await fetch(
        `/api/experience-comments?approved_only=true&limit=${commentsPerPage}&offset=${(currentPage - 1) * commentsPerPage}`
      );
      if (response.ok) {
        const data = await response.json();
        if (currentPage === 1 || resetPage) {
          setComments(data.comments || []);
        } else {
          setComments((prev) => [...prev, ...(data.comments || [])]);
        }
        setHasMore((data.comments || []).length === commentsPerPage);
      }
    } catch (error) {
      console.error("Error fetching experience comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleCommentSubmitted = () => {
    // Refresh comments after submission
    setPage(1);
    fetchComments(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900" dir="rtl">
      <Navbar />
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block border border-coffee-500/50 px-6 py-2 rounded-full bg-black/40 backdrop-blur-sm mb-6">
            <span className="text-coffee-400 uppercase tracking-widest text-sm font-bold">
              تجربه مشتریان
            </span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
            نظرات و تجربیات
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-coffee-300 via-coffee-500 to-coffee-300">
              مشتریان ما
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-loose">
            تجربه واقعی مشتریان از کافه واژه را بخوانید و نظر خود را با ما به اشتراک بگذارید
          </p>
        </div>
      </section>

      {/* Comment Submission Form Section */}
      <section className="py-12 px-4 bg-neutral-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-coffee-400 mb-4">
              <MessageSquare size={24} />
              <h2 className="text-2xl font-bold text-white">
                تجربه خود را با ما به اشتراک بگذارید
              </h2>
            </div>
            <p className="text-gray-400">
              نظر شما پس از بررسی و تایید مدیر نمایش داده خواهد شد
            </p>
          </div>
          <ExperienceComments isDark={true} onCommentSubmitted={handleCommentSubmitted} />
        </div>
      </section>

      {/* Comments Display Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4 font-black">
              نظرات تایید شده
            </h2>
            <p className="text-gray-400">
              {comments.length > 0
                ? `${comments.length} نظر ثبت شده`
                : "هنوز نظری ثبت نشده است"}
            </p>
          </div>

          {loading && comments.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-coffee-500 w-8 h-8" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-20">
              <Quote size={64} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-400 text-lg">
                هنوز نظری ثبت نشده است. اولین کسی باشید که نظر خود را ثبت می‌کند!
              </p>
            </div>
          ) : (
            <>
              {/* Comments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 hover:border-coffee-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-coffee-900/30 rounded-full flex items-center justify-center text-coffee-400 flex-shrink-0 group-hover:bg-coffee-900/50 transition-colors">
                        <Quote size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((starValue) => (
                            <Star
                              key={starValue}
                              size={16}
                              fill={comment.rating >= starValue ? "currentColor" : "none"}
                              className={cn(
                                "transition-colors",
                                comment.rating >= starValue ? "text-yellow-400" : "text-gray-600"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                          {comment.customer_name || comment.customer_phone || "مشتری ناشناس"}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-300 leading-7 mb-4 line-clamp-6">
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

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className={cn(
                      "px-8 py-3 rounded-full font-bold text-lg transition-all",
                      "bg-coffee-600 hover:bg-coffee-500 text-white",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center gap-2 mx-auto"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        در حال بارگذاری...
                      </>
                    ) : (
                      "بارگذاری نظرات بیشتر"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

