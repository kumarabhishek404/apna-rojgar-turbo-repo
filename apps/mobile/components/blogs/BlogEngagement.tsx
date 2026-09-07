import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import BLOGS, { type BlogComment, type BlogEngagement } from "@/app/api/blogs";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import Colors from "@/constants/Colors";
import TOAST from "@/app/hooks/toast";
import { t } from "@/utils/translationHelper";
import { shareTipArticle } from "@/utils/blogShare";
import { hasAuthenticatedUser, isSessionValid } from "@/utils/session";
import { isAuthApiError } from "@/utils/apiError";

type Props = {
  slug: string;
  title: string;
  initialLikeCount?: number;
  initialCommentCount?: number;
  initialShareCount?: number;
};

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

const BlogEngagementPanel = ({
  slug,
  title,
  initialLikeCount = 0,
  initialCommentCount = 0,
  initialShareCount = 0,
}: Props) => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const loggedIn =
    isSessionValid(userDetails) && hasAuthenticatedUser(userDetails);
  const myUserId = String(userDetails?._id || "");

  const [engagement, setEngagement] = useState<BlogEngagement>({
    likeCount: initialLikeCount,
    commentCount: initialCommentCount,
    shareCount: initialShareCount,
    likedByMe: false,
  });
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);

  const requireLogin = useCallback(() => {
    TOAST.info(t("blogLoginRequired"));
    router.push("/screens/auth/login");
  }, []);

  const loadEngagement = useCallback(async () => {
    try {
      const data = await BLOGS.getEngagement(slug);
      if (data) {
        setEngagement({
          likeCount: data.likeCount || 0,
          commentCount: data.commentCount || 0,
          shareCount: data.shareCount || 0,
          likedByMe: Boolean(data.likedByMe),
        });
      }
    } catch {
      // keep props
    }
  }, [slug]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await BLOGS.listComments(slug, { page: 1, limit: 50 });
      setComments(data?.comments || []);
    } catch {
      // ignore soft fail
    } finally {
      setLoadingComments(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadEngagement();
    void loadComments();
  }, [loadEngagement, loadComments, loggedIn]);

  const onToggleLike = async () => {
    if (!loggedIn) {
      requireLogin();
      return;
    }
    setBusy(true);
    try {
      const data = await BLOGS.toggleLike(slug);
      setEngagement((prev) => ({
        ...prev,
        likedByMe: data.likedByMe,
        likeCount: data.likeCount,
      }));
    } catch (error: any) {
      if (isAuthApiError(error)) requireLogin();
      else TOAST.error(error?.response?.data?.message || t("blogLikeFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    try {
      const data = await BLOGS.recordShare(slug);
      if (data?.shareCount != null) {
        setEngagement((prev) => ({ ...prev, shareCount: data.shareCount }));
      }
    } catch {
      // still share locally
    }
    try {
      await shareTipArticle({
        title,
        slug,
        messagePrefix: t("blogSharePrefix"),
      });
    } catch {
      // user cancelled
    }
  };

  const onSubmitComment = async () => {
    if (!loggedIn) {
      requireLogin();
      return;
    }
    const body = commentText.trim();
    if (body.length < 2) {
      TOAST.error(t("blogCommentTooShort"));
      return;
    }
    setBusy(true);
    try {
      const data = await BLOGS.createComment(slug, body);
      if (data?.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setEngagement((prev) => ({
          ...prev,
          commentCount: data.commentCount,
        }));
        setCommentText("");
      }
    } catch (error: any) {
      if (isAuthApiError(error)) requireLogin();
      else TOAST.error(error?.response?.data?.message || t("blogCommentFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onSubmitReply = async (commentId: string) => {
    if (!loggedIn) {
      requireLogin();
      return;
    }
    const body = replyText.trim();
    if (body.length < 2) {
      TOAST.error(t("blogCommentTooShort"));
      return;
    }
    setBusy(true);
    try {
      const data = await BLOGS.replyComment(slug, commentId, body);
      if (data?.reply) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, replies: [...(c.replies || []), data.reply] }
              : c,
          ),
        );
        setEngagement((prev) => ({
          ...prev,
          commentCount: data.commentCount,
        }));
        setReplyTo(null);
        setReplyText("");
      }
    } catch (error: any) {
      if (isAuthApiError(error)) requireLogin();
      else TOAST.error(error?.response?.data?.message || t("blogCommentFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onSaveEdit = async (commentId: string) => {
    const body = editText.trim();
    if (body.length < 2) {
      TOAST.error(t("blogCommentTooShort"));
      return;
    }
    setBusy(true);
    try {
      const data = await BLOGS.updateComment(slug, commentId, body);
      if (data?.comment) {
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === commentId) return { ...c, body: data.comment.body };
            return {
              ...c,
              replies: (c.replies || []).map((r) =>
                r._id === commentId ? { ...r, body: data.comment.body } : r,
              ),
            };
          }),
        );
        setEditingId(null);
        setEditText("");
      }
    } catch (error: any) {
      TOAST.error(error?.response?.data?.message || t("blogCommentFailed"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (commentId: string) => {
    setBusy(true);
    try {
      const data = await BLOGS.deleteComment(slug, commentId);
      setComments((prev) =>
        prev
          .filter((c) => c._id !== commentId)
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => r._id !== commentId),
          })),
      );
      if (data?.commentCount != null) {
        setEngagement((prev) => ({ ...prev, commentCount: data.commentCount }));
      }
    } catch (error: any) {
      TOAST.error(error?.response?.data?.message || t("blogCommentFailed"));
    } finally {
      setBusy(false);
    }
  };

  const isOwn = (authorId?: string) =>
    Boolean(myUserId && authorId && String(authorId) === myUserId);

  const renderComment = (item: BlogComment, isReply = false) => {
    const own = isOwn(item.author?._id);
    const editing = editingId === item._id;
    return (
      <View
        key={item._id}
        style={[styles.commentCard, isReply && styles.replyCard]}
      >
        <CustomHeading textAlign="left" baseFont={13} fontWeight="700">
          {item.author?.name || t("anonymous")}
        </CustomHeading>
        <CustomText baseFont={10} color="#94A3B8" textAlign="left">
          {formatWhen(item.createdAt)}
        </CustomText>
        {editing ? (
          <>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={styles.input}
              multiline
            />
            <View style={styles.row}>
              <ActionChip
                label={t("save")}
                onPress={() => onSaveEdit(item._id)}
                disabled={busy}
              />
              <ActionChip
                label={t("cancel")}
                onPress={() => {
                  setEditingId(null);
                  setEditText("");
                }}
              />
            </View>
          </>
        ) : (
          <CustomText textAlign="left" baseFont={13} style={{ marginTop: 6 }}>
            {item.body}
          </CustomText>
        )}

        {!editing ? (
          <View style={styles.row}>
            {!isReply ? (
              <ActionChip
                label={t("blogReply")}
                onPress={() => {
                  if (!loggedIn) {
                    requireLogin();
                    return;
                  }
                  setReplyTo(item._id);
                  setReplyText("");
                }}
              />
            ) : null}
            {own ? (
              <>
                <ActionChip
                  label={t("edit")}
                  onPress={() => {
                    setEditingId(item._id);
                    setEditText(item.body);
                  }}
                />
                <ActionChip
                  label={t("delete")}
                  danger
                  onPress={() => onDelete(item._id)}
                  disabled={busy}
                />
              </>
            ) : null}
          </View>
        ) : null}

        {replyTo === item._id ? (
          <View style={styles.replyBox}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={t("blogWriteReply")}
              placeholderTextColor="#94A3B8"
              style={styles.input}
              multiline
            />
            <View style={styles.row}>
              <ActionChip
                label={t("blogPostReply")}
                primary
                onPress={() => onSubmitReply(item._id)}
                disabled={busy}
              />
              <ActionChip
                label={t("cancel")}
                onPress={() => {
                  setReplyTo(null);
                  setReplyText("");
                }}
              />
            </View>
          </View>
        ) : null}

        {(item.replies || []).map((reply) => renderComment(reply, true))}
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <EngagementBtn
          icon={engagement.likedByMe ? "heart" : "heart-outline"}
          color={engagement.likedByMe ? "#E11D48" : Colors.primary}
          label={`${engagement.likeCount}`}
          sub={t("blogLikes")}
          onPress={onToggleLike}
          disabled={busy}
        />
        <EngagementBtn
          icon="chatbubble-outline"
          color={Colors.primary}
          label={`${engagement.commentCount}`}
          sub={t("blogComments")}
          onPress={() => {}}
        />
        <EngagementBtn
          icon="share-social-outline"
          color={Colors.primary}
          label={`${engagement.shareCount}`}
          sub={t("blogShare")}
          onPress={onShare}
          disabled={busy}
        />
      </View>

      <CustomHeading textAlign="left" baseFont={16} fontWeight="800" style={{ marginTop: 16 }}>
        {t("blogComments")}
      </CustomHeading>

      <TextInput
        value={commentText}
        onChangeText={setCommentText}
        placeholder={
          loggedIn ? t("blogWriteComment") : t("blogLoginToComment")
        }
        placeholderTextColor="#94A3B8"
        style={[styles.input, { marginTop: 10 }]}
        multiline
        onFocus={() => {
          if (!loggedIn) requireLogin();
        }}
      />
      <TouchableOpacity
        style={[styles.postBtn, busy && { opacity: 0.6 }]}
        onPress={onSubmitComment}
        disabled={busy}
      >
        <CustomText color={Colors.white} fontWeight="700" baseFont={13}>
          {t("blogPostComment")}
        </CustomText>
      </TouchableOpacity>

      {loadingComments ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
      ) : comments.length === 0 ? (
        <CustomText
          color={Colors.subHeading}
          textAlign="left"
          style={{ marginTop: 12 }}
        >
          {t("blogNoComments")}
        </CustomText>
      ) : (
        <View style={{ marginTop: 12, gap: 10 }}>
          {comments.map((c) => renderComment(c))}
        </View>
      )}
    </View>
  );
};

const EngagementBtn = ({
  icon,
  color,
  label,
  sub,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  sub: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={styles.engBtn}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
  >
    <Ionicons name={icon} size={18} color={color} />
    <CustomText fontWeight="700" baseFont={13} color="#1F2E4D">
      {label}
    </CustomText>
    <CustomText baseFont={10} color="#64748B">
      {sub}
    </CustomText>
  </TouchableOpacity>
);

const ActionChip = ({
  label,
  onPress,
  disabled,
  primary,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.chip,
      primary && { backgroundColor: Colors.primary, borderColor: Colors.primary },
      danger && { borderColor: "#FCA5A5" },
    ]}
  >
    <CustomText
      baseFont={11}
      fontWeight="700"
      color={primary ? Colors.white : danger ? "#DC2626" : Colors.primary}
    >
      {label}
    </CustomText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingBottom: 40,
  },
  toolbar: {
    flexDirection: "row",
    gap: 8,
  },
  engBtn: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#E4EAF3",
    borderRadius: 12,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E4EAF3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    backgroundColor: Colors.white,
    color: "#1F2E4D",
    fontSize: 14,
    textAlignVertical: "top",
  },
  postBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  commentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4EAF3",
    padding: 12,
  },
  replyCard: {
    marginTop: 8,
    marginLeft: 12,
    backgroundColor: "#F8FAFC",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#EFF6FF",
  },
  replyBox: {
    marginTop: 10,
  },
});

export default BlogEngagementPanel;
