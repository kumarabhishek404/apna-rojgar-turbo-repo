"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Reply, Share2 } from "lucide-react";
import { apiRequest, getAuth } from "@/lib/auth";
import {
  AUTH_CHANGED_EVENT,
  openLoginModal,
  type AuthChangedDetail,
} from "@/lib/openLoginModal";
import { rojgarTipsArticlePath } from "@/constants";
import { useLanguage } from "@/components/LanguageProvider";

type Author = {
  _id?: string;
  name?: string;
  photo?: string;
};

export type BlogCommentItem = {
  _id: string;
  body: string;
  createdAt?: string;
  author?: Author;
  replies?: BlogCommentItem[];
};

type EngagementState = {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
};

type PendingAuthAction =
  | { type: "like" }
  | { type: "comment" }
  | { type: "open-reply"; commentId: string }
  | { type: "reply"; commentId: string };

function formatWhen(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function EngagementToolbar({
  engagement,
  busy,
  onToggleLike,
  onShare,
  t,
  compact = false,
}: {
  engagement: EngagementState;
  busy: boolean;
  onToggleLike: () => void;
  onShare: () => void;
  t: (key: string, fallback: string) => string;
  compact?: boolean;
}) {
  const pad = compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onToggleLike}
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition ${pad} ${
          engagement.likedByMe
            ? "border-rose-300 bg-rose-50 text-rose-600"
            : "border-slate-200 bg-white text-slate-700 hover:border-[#22409a]/30 hover:text-[#22409a]"
        }`}
      >
        <Heart
          size={compact ? 14 : 16}
          className={engagement.likedByMe ? "fill-current" : ""}
        />
        {engagement.likeCount}
        <span className={compact ? "hidden sm:inline" : undefined}>
          {" "}
          {t("blogLikes", "Likes")}
        </span>
      </button>
      <a
        href="#blog-comments"
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 transition hover:border-[#22409a]/30 hover:text-[#22409a] ${pad}`}
      >
        <MessageCircle size={compact ? 14 : 16} />
        {engagement.commentCount}
        <span className={compact ? "hidden sm:inline" : undefined}>
          {" "}
          {t("blogComments", "Comments")}
        </span>
      </a>
      <button
        type="button"
        onClick={onShare}
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 transition hover:border-[#22409a]/30 hover:text-[#22409a] ${pad}`}
      >
        <Share2 size={compact ? 14 : 16} />
        {engagement.shareCount}
        <span className={compact ? "hidden sm:inline" : undefined}>
          {" "}
          {t("blogShare", "Share")}
        </span>
      </button>
    </div>
  );
}

export default function BlogEngagement({
  blogId,
  slug,
  title,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialShareCount = 0,
  topBar,
  children,
}: {
  blogId: string;
  slug: string;
  title: string;
  initialLikeCount?: number;
  initialCommentCount?: number;
  initialShareCount?: number;
  topBar?: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  const [authVersion, setAuthVersion] = useState(0);
  const auth = useMemo(() => getAuth(), [authVersion]);
  const isLoggedIn = Boolean(auth?.token);
  const myUserId = useMemo(() => {
    const user = (auth?.user || {}) as Record<string, unknown>;
    return typeof user._id === "string" ? user._id : "";
  }, [auth]);

  const [engagement, setEngagement] = useState<EngagementState>({
    likeCount: initialLikeCount,
    commentCount: initialCommentCount,
    shareCount: initialShareCount,
    likedByMe: false,
  });
  const [comments, setComments] = useState<BlogCommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pendingAuthActionRef = useRef<PendingAuthAction | null>(null);
  const commentTextRef = useRef(commentText);
  const replyTextRef = useRef(replyText);
  commentTextRef.current = commentText;
  replyTextRef.current = replyText;

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return rojgarTipsArticlePath(slug);
    return `${window.location.origin}${rojgarTipsArticlePath(slug)}`;
  }, [slug]);

  const requestLogin = useCallback((action: PendingAuthAction) => {
    pendingAuthActionRef.current = action;
    openLoginModal({ stayOnPage: true });
  }, []);

  const loadEngagement = useCallback(async () => {
    try {
      const data = await apiRequest<{
        data: EngagementState & { blogId?: string };
      }>(`/blogs/${encodeURIComponent(slug)}/engagement`);
      if (data?.data) {
        setEngagement({
          likeCount: data.data.likeCount || 0,
          commentCount: data.data.commentCount || 0,
          shareCount: data.data.shareCount || 0,
          likedByMe: Boolean(data.data.likedByMe),
        });
      }
    } catch {
      // Public counts still shown from props
    }
  }, [slug]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await apiRequest<{
        data: { comments: BlogCommentItem[] };
      }>(`/blogs/${encodeURIComponent(slug)}/comments?page=1&limit=50`);
      setComments(data?.data?.comments || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadEngagement();
    void loadComments();
  }, [loadEngagement, loadComments]);

  const performToggleLike = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest<{
        data: { likedByMe: boolean; likeCount: number };
      }>(`/blogs/${encodeURIComponent(slug)}/like`, { method: "POST" });
      if (data?.data) {
        setEngagement((prev) => ({
          ...prev,
          likedByMe: data.data.likedByMe,
          likeCount: data.data.likeCount,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update like");
    } finally {
      setBusy(false);
    }
  }, [slug]);

  const performSubmitComment = useCallback(async () => {
    const body = commentTextRef.current.trim();
    if (body.length < 2) return;
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest<{
        data: { comment: BlogCommentItem; commentCount: number };
      }>(`/blogs/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      if (data?.data?.comment) {
        setComments((prev) => [data.data.comment, ...prev]);
        setEngagement((prev) => ({
          ...prev,
          commentCount: data.data.commentCount,
        }));
        setCommentText("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setBusy(false);
    }
  }, [slug]);

  const performSubmitReply = useCallback(
    async (commentId: string) => {
      const body = replyTextRef.current.trim();
      if (body.length < 2) return;
      setBusy(true);
      setError("");
      try {
        const data = await apiRequest<{
          data: {
            reply: BlogCommentItem & { parentId?: string };
            commentCount: number;
          };
        }>(`/blogs/${encodeURIComponent(slug)}/comments/${commentId}/replies`, {
          method: "POST",
          body: JSON.stringify({ body }),
        });
        if (data?.data?.reply) {
          setComments((prev) =>
            prev.map((c) =>
              c._id === commentId
                ? {
                    ...c,
                    replies: [...(c.replies || []), data.data.reply],
                  }
                : c,
            ),
          );
          setEngagement((prev) => ({
            ...prev,
            commentCount: data.data.commentCount,
          }));
          setReplyText("");
          setReplyTo(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not post reply");
      } finally {
        setBusy(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    const onAuthChanged = (event: Event) => {
      const detail = (event as CustomEvent<AuthChangedDetail>).detail || {};
      setAuthVersion((v) => v + 1);
      void loadEngagement();

      if (!detail.stayOnPage) return;
      const pending = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      if (!pending) return;

      window.setTimeout(() => {
        if (pending.type === "like") {
          void performToggleLike();
          return;
        }
        if (pending.type === "comment") {
          void performSubmitComment();
          return;
        }
        if (pending.type === "open-reply") {
          setReplyTo(pending.commentId);
          setReplyText("");
          document
            .getElementById("blog-comments")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (pending.type === "reply") {
          void performSubmitReply(pending.commentId);
        }
      }, 0);
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [
    loadEngagement,
    performToggleLike,
    performSubmitComment,
    performSubmitReply,
  ]);

  const onToggleLike = async () => {
    if (!getAuth()?.token) {
      requestLogin({ type: "like" });
      return;
    }
    await performToggleLike();
  };

  const recordShare = async () => {
    try {
      const data = await apiRequest<{ data: { shareCount: number } }>(
        `/blogs/${encodeURIComponent(slug)}/share`,
        { method: "POST" },
      );
      if (data?.data) {
        setEngagement((prev) => ({
          ...prev,
          shareCount: data.data.shareCount,
        }));
      }
    } catch {
      // Don't block the share UX if counting fails
    }
  };

  const onShare = async () => {
    setError("");
    setMessage("");
    const url = String(shareUrl || "").trim();
    if (!url) {
      setError(t("blogShareFailed", "Could not share. Copy the URL from the address bar."));
      return;
    }

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          url,
        });
        await recordShare();
        setMessage(t("blogShared", "Shared"));
        return;
      }
      await navigator.clipboard.writeText(url);
      await recordShare();
      setMessage(t("blogLinkCopied", "Link copied"));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        await recordShare();
        setMessage(t("blogLinkCopied", "Link copied"));
      } catch {
        setError(
          t(
            "blogShareFailed",
            "Could not share. Copy the URL from the address bar.",
          ),
        );
      }
    }
  };

  const onSubmitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!getAuth()?.token) {
      requestLogin({ type: "comment" });
      return;
    }
    await performSubmitComment();
  };

  const onSubmitReply = async (event: FormEvent, commentId: string) => {
    event.preventDefault();
    if (!getAuth()?.token) {
      requestLogin({ type: "reply", commentId });
      return;
    }
    await performSubmitReply(commentId);
  };

  const onDelete = async (commentId: string, parentId?: string) => {
    if (!getAuth()?.token) return;
    if (
      !window.confirm(
        t("blogDeleteCommentConfirm", "Delete this comment?"),
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await apiRequest<{ data: { commentCount: number } }>(
        `/blogs/${encodeURIComponent(slug)}/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? {
                  ...c,
                  replies: (c.replies || []).filter((r) => r._id !== commentId),
                }
              : c,
          ),
        );
      } else {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
      if (data?.data) {
        setEngagement((prev) => ({
          ...prev,
          commentCount: data.data.commentCount,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {topBar || children ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">{topBar}</div>
          <EngagementToolbar
            engagement={engagement}
            busy={busy}
            onToggleLike={() => void onToggleLike()}
            onShare={() => void onShare()}
            t={t}
            compact
          />
        </div>
      ) : null}

      {children}

      <section className="mt-10 space-y-6 border-t border-slate-200 pt-8">
        <EngagementToolbar
          engagement={engagement}
          busy={busy}
          onToggleLike={() => void onToggleLike()}
          onShare={() => void onShare()}
          t={t}
        />

        {message ? (
          <p className="text-sm font-medium text-emerald-700">{message}</p>
        ) : null}
        {error ? (
          <p className="text-sm font-medium text-red-600">{error}</p>
        ) : null}

        <div id="blog-comments" className="space-y-4">
          <h2 className="text-xl font-bold text-[#16264f]">
            {t("blogCommentsHeading", "Comments")}
          </h2>

          <form onSubmit={onSubmitComment} className="space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={
                isLoggedIn
                  ? t("blogCommentPlaceholder", "Write a comment…")
                  : t("blogLoginToComment", "Log in to write a comment…")
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-[#22409a] focus:ring-2"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy || commentText.trim().length < 2}
                className="rounded-xl bg-[#22409a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t("blogPostComment", "Post comment")}
              </button>
            </div>
          </form>

          {loadingComments ? (
            <p className="text-sm text-slate-500">{t("loading", "Loading...")}</p>
          ) : comments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              {t("blogNoComments", "No comments yet. Be the first to comment.")}
            </p>
          ) : (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li
                  key={comment._id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#16264f]">
                        {comment.author?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatWhen(comment.createdAt)}
                      </p>
                    </div>
                    {myUserId && comment.author?._id === myUserId ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onDelete(comment._id)}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        {t("delete", "Delete")}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {comment.body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!getAuth()?.token) {
                          requestLogin({
                            type: "open-reply",
                            commentId: comment._id,
                          });
                          return;
                        }
                        setReplyTo((prev) =>
                          prev === comment._id ? null : comment._id,
                        );
                        setReplyText("");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#22409a] hover:underline"
                    >
                      <Reply size={14} />
                      {t("blogReply", "Reply")}
                    </button>
                  </div>

                  {replyTo === comment._id ? (
                    <form
                      onSubmit={(e) => void onSubmitReply(e, comment._id)}
                      className="mt-3 space-y-2 border-l-2 border-[#22409a]/20 pl-3"
                    >
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        maxLength={2000}
                        placeholder={t(
                          "blogReplyPlaceholder",
                          "Write a reply…",
                        )}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-[#22409a] focus:ring-2"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={busy || replyText.trim().length < 2}
                          className="rounded-lg bg-[#22409a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {t("blogPostReply", "Post reply")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyText("");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                        >
                          {t("cancel", "Cancel")}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {(comment.replies || []).length > 0 ? (
                    <ul className="mt-4 space-y-3 border-l border-slate-100 pl-4">
                      {comment.replies!.map((reply) => (
                        <li key={reply._id} className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[#16264f]">
                                {reply.author?.name || "User"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatWhen(reply.createdAt)}
                              </p>
                            </div>
                            {myUserId && reply.author?._id === myUserId ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void onDelete(reply._id, comment._id)
                                }
                                className="text-xs font-semibold text-red-500 hover:underline"
                              >
                                {t("delete", "Delete")}
                              </button>
                            ) : null}
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                            {reply.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className="sr-only">{blogId}</span>
        <span className="sr-only">{title}</span>
      </section>
    </>
  );
}
