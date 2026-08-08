import React from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import Colors from "@/constants/Colors";
import type { BlogPost } from "@/app/api/blogs";
import { nativeTipsDetailPath } from "@/utils/blogShare";

type Props = {
  blog: BlogPost;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const BlogCard = ({ blog }: Props) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push(nativeTipsDetailPath(blog.slug) as any)}
    >
      {blog.coverImageUrl ? (
        <Image
          source={{ uri: blog.coverImageUrl }}
          style={styles.cover}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Ionicons name="newspaper-outline" size={28} color={Colors.primary} />
        </View>
      )}
      <View style={styles.body}>
        <CustomHeading textAlign="left" baseFont={16} fontWeight="800" color="#16264F">
          {blog.title}
        </CustomHeading>
        {blog.excerpt ? (
          <CustomText
            textAlign="left"
            baseFont={13}
            color={Colors.subHeading}
            numberOfLines={3}
            style={{ marginTop: 6 }}
          >
            {blog.excerpt}
          </CustomText>
        ) : null}
        <View style={styles.metaRow}>
          <CustomText baseFont={11} color="#64748B">
            {formatDate(blog.publishedAt || blog.createdAt)}
          </CustomText>
          <View style={styles.stats}>
            <Ionicons name="heart-outline" size={13} color="#64748B" />
            <CustomText baseFont={11} color="#64748B">
              {blog.likeCount || 0}
            </CustomText>
            <Ionicons name="chatbubble-outline" size={12} color="#64748B" />
            <CustomText baseFont={11} color="#64748B">
              {blog.commentCount || 0}
            </CustomText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4EAF3",
    overflow: "hidden",
    marginBottom: 12,
  },
  cover: {
    width: "100%",
    height: 160,
    backgroundColor: "#EEF4FF",
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 14,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});

export default BlogCard;
