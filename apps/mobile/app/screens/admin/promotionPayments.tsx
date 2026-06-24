import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import ADMIN from "@/app/api/admin";
import CustomHeader from "@/components/commons/Header";
import Loader from "@/components/commons/Loaders/Loader";
import CategoryButtons from "@/components/inputs/CategoryButtons";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";
import PaginationString from "@/components/commons/Pagination/PaginationString";
import ProfilePicture from "@/components/commons/ProfilePicture";
import Colors from "@/constants/Colors";
import { ADMIN_PROMOTION_PAYMENTS } from "@/constants";
import { t } from "@/utils/translationHelper";

const statusColor = (status?: string) => {
  switch (String(status || "").toUpperCase()) {
    case "PAID":
      return "#047857";
    case "CREATED":
      return "#B45309";
    case "FAILED":
      return Colors.danger;
    default:
      return Colors.subHeading;
  }
};

const AdminPromotionPaymentsScreen = () => {
  const [status, setStatus] = useState("ALL");
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const {
    data: response,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["adminPromotionPayments", status],
    queryFn: ({ pageParam }) =>
      ADMIN.fetchPromotionPayments({ pageParam, status }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    retry: false,
  });

  const stats = response?.pages?.[0]?.stats;
  const total = response?.pages?.[0]?.pagination?.total || 0;

  useFocusEffect(
    React.useCallback(() => {
      setFilteredData(response?.pages?.flatMap((page: any) => page.data || []) || []);
    }, [response]),
  );

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const summaryCards = useMemo(
    () => [
      {
        label: t("adminPromotionPaidCount"),
        value: stats?.paid ?? 0,
        color: "#047857",
      },
      {
        label: t("adminPromotionTotalAmount"),
        value: `₹${stats?.totalPaidAmount ?? 0}`,
        color: Colors.primary,
      },
      {
        label: t("adminPromotionServicesCount"),
        value: stats?.promotedServices ?? 0,
        color: "#7C3AED",
      },
    ],
    [stats],
  );

  const renderPayment = ({ item }: { item: any }) => {
    const employer = item?.user;
    const service = item?.service;
    const isLinked = Boolean(service?._id);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={isLinked ? 0.85 : 1}
        onPress={() => {
          if (service?._id) {
            router.push({
              pathname: "/screens/service/[id]",
              params: { id: service._id, title: "titleMyAllServicesAndBookings" },
            });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.employerRow}>
            <ProfilePicture
              uri={employer?.profilePicture}
              style={styles.avatar}
            />
            <View style={styles.employerInfo}>
              <CustomHeading textAlign="left" baseFont={15} fontWeight="800">
                {employer?.name || t("unknownUser")}
              </CustomHeading>
              <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
                {employer?.mobile || "-"}
              </CustomText>
            </View>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${statusColor(item?.status)}20` },
            ]}
          >
            <CustomText
              baseFont={11}
              fontWeight="800"
              color={statusColor(item?.status)}
            >
              {item?.status}
            </CustomText>
          </View>
        </View>

        <View style={styles.amountRow}>
          <CustomText textAlign="left" baseFont={22} fontWeight="800" color={Colors.primary}>
            ₹{item?.amount}
          </CustomText>
          <CustomText textAlign="right" baseFont={12} color={Colors.subHeading}>
            {item?.paidAt
              ? moment(item.paidAt).format("DD MMM YYYY, hh:mm A")
              : moment(item?.createdAt).format("DD MMM YYYY, hh:mm A")}
          </CustomText>
        </View>

        <View style={styles.metaBlock}>
          <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
            {t("orderId")}: {item?.orderId}
          </CustomText>
          {service ? (
            <>
              <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
                {t("jobId")}: {service?.jobID}
              </CustomText>
              <CustomText textAlign="left" baseFont={12} color={Colors.primary}>
                {t(service?.type)} · {t(service?.subType)}
              </CustomText>
              <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
                {service?.address}
              </CustomText>
            </>
          ) : (
            <CustomText textAlign="left" baseFont={12} color="#B45309">
              {t("adminPromotionServicePending")}
            </CustomText>
          )}
        </View>

        {isLinked ? (
          <View style={styles.linkRow}>
            <CustomText baseFont={12} fontWeight="700" color={Colors.primary}>
              {t("viewService")}
            </CustomText>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <CustomHeader
              title="adminPromotionPayments"
              left="back"
              right="notification"
            />
          ),
        }}
      />
      <View style={styles.container}>
        <Loader loading={isLoading && !isRefetching} />

        <View style={styles.summaryRow}>
          {summaryCards.map((card) => (
            <View key={card.label} style={styles.summaryCard}>
              <CustomText baseFont={11} color={Colors.subHeading}>
                {card.label}
              </CustomText>
              <CustomHeading baseFont={18} fontWeight="800" color={card.color}>
                {card.value}
              </CustomHeading>
            </View>
          ))}
        </View>

        <CategoryButtons
          type="workerType"
          options={ADMIN_PROMOTION_PAYMENTS}
          onCategoryChanged={setStatus}
        />

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderPayment}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyDataPlaceholder title="adminPromotionEmpty" />
            ) : null
          }
          ListFooterComponent={
            filteredData.length > 0 ? (
              <PaginationString
                type="adminPromotionEmpty"
                isLoading={isFetchingNextPage}
                totalFetchedData={filteredData.length}
                totalData={total}
              />
            ) : null
          }
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.1)",
    gap: 6,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.12)",
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  employerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  employerInfo: {
    flex: 1,
    gap: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  metaBlock: {
    marginTop: 10,
    gap: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFF",
  },
  linkRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
});

export default AdminPromotionPaymentsScreen;
