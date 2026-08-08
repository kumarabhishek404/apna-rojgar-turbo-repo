import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import CustomHeader from "@/components/commons/Header";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import BlogHtmlBody from "@/components/blogs/BlogHtmlBody";
import BlogEngagementPanel from "@/components/blogs/BlogEngagement";
import BLOGS from "@/app/api/blogs";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";

const CONTENT_PAD = 16;

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

const TipDetailScreen = () => {
  const { width: screenWidth } = useWindowDimensions();
  const [coverAspectRatio, setCoverAspectRatio] = useState(16 / 9);
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === "string" ? params.slug.trim() : "";

  const query = useQuery({
    queryKey: ["rojgarTip", slug],
    queryFn: () => BLOGS.getBlogBySlug(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  const blog = query.data;
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader title="rojgarTips" left="back" right="notification" />
          ),
        }}
      />
      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : query.isError || !blog ? (
        <View style={styles.center}>
          <CustomText color={Colors.danger}>{t("blogNotFound")}</CustomText>
          <TouchableOpacity onPress={() => query.refetch()} style={{ marginTop: 10 }}>
            <CustomText color={Colors.primary} fontWeight="700">
              {t("refresh")}
            </CustomText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <CustomHeading
            textAlign="left"
            baseFont={22}
            fontWeight="800"
            color="#16264F"
            style={{ marginTop: 4 }}
          >
            {blog.title}
          </CustomHeading>

          <CustomText textAlign="left" baseFont={12} color="#64748B" style={{ marginTop: 8 }}>
            {[blog.authorName, formatDate(blog.publishedAt || blog.createdAt)]
              .filter(Boolean)
              .join(" · ")}
          </CustomText>

          {blog.coverImageUrl ? (
            <Image
              source={{ uri: blog.coverImageUrl }}
              style={[
                styles.cover,
                {
                  width: screenWidth,
                  aspectRatio: coverAspectRatio,
                  marginLeft: -CONTENT_PAD,
                },
              ]}
              resizeMode="contain"
              onLoad={(event) => {
                const { width, height } = event.nativeEvent.source;
                if (width > 0 && height > 0) {
                  setCoverAspectRatio(width / height);
                }
              }}
            />
          ) : null}

          <View style={styles.body}>
            <BlogHtmlBody content={blog.content || ""} />
          </View>

          <BlogEngagementPanel
            slug={blog.slug}
            title={blog.title}
            initialLikeCount={blog.likeCount}
            initialCommentCount={blog.commentCount}
            initialShareCount={blog.shareCount}
          />
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF4FF" },
  content: {
    paddingHorizontal: CONTENT_PAD,
    paddingBottom: 40,
    paddingTop: 8,
  },
  cover: {
    backgroundColor: Colors.white,
    marginTop: 14,
    marginBottom: 4,
  },
  body: {
    marginTop: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    padding: 24,
  },
});

export default TipDetailScreen;
