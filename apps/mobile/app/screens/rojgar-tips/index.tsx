import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "@/components/commons/Header";
import CustomText from "@/components/commons/CustomText";
import BlogCard from "@/components/blogs/BlogCard";
import BLOGS from "@/app/api/blogs";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";

const TipsListScreen = () => {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(draft.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [draft]);

  const query = useInfiniteQuery({
    queryKey: ["rojgarTips", search],
    queryFn: ({ pageParam = 1 }) =>
      BLOGS.listBlogs({ page: pageParam, limit: 12, search }),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    getNextPageParam: (last) => {
      const page = last?.pagination?.page || 1;
      const pages = last?.pagination?.pages || 1;
      return page < pages ? page + 1 : undefined;
    },
  });

  const blogs = useMemo(
    () => (query.data?.pages || []).flatMap((p) => p?.blogs || []),
    [query.data],
  );

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    query.refetch,
  );

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
      <View style={styles.root}>
        <View style={styles.hero}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#64748B" />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t("searchBlogs")}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => setSearch(draft.trim())}
            />
            {draft ? (
              <TouchableOpacity
                onPress={() => {
                  setDraft("");
                  setSearch("");
                }}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {query.isLoading && !query.data ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : query.isError && blogs.length === 0 ? (
          <View style={styles.center}>
            <CustomText color={Colors.danger}>{t("blogLoadFailed")}</CustomText>
            <TouchableOpacity onPress={() => query.refetch()} style={styles.retry}>
              <CustomText color={Colors.primary} fontWeight="700">
                {t("refresh")}
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={blogs}
            keyExtractor={(item) => item._id || item.slug}
            renderItem={({ item }) => <BlogCard blog={item} />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            onEndReached={() => {
              if (query.hasNextPage && !query.isFetchingNextPage) {
                query.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.empty}>
                <CustomText color={Colors.subHeading}>
                  {t("noBlogsYet")}
                </CustomText>
              </View>
            }
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator color={Colors.primary} style={{ margin: 16 }} />
              ) : null
            }
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF4FF" },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4EAF3",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: "#1F2E4D",
    fontSize: 14,
    paddingVertical: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  retry: { padding: 8 },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
  },
});

export default TipsListScreen;
