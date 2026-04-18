import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useMemo } from "react";
import Colors from "@/constants/Colors";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import coverImage from "../../assets/images/placeholder-cover.jpg";
import { debounce } from "lodash";
import { dateDifference, getTimeAgo } from "@/constants/functions";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import ShowAddress from "./ShowAddress";
import ShowDistance from "./ShowDistance";
import { t } from "@/utils/translationHelper";
import { getDynamicWorkerType } from "@/utils/i18n";
import { getServiceListHeroIcon } from "@/utils/serviceListHeroIcon";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import type { ComponentProps } from "react";

const CARD_W = 240;
const CARD_H = 390;
const IMG_H_MIN = 120;

type IonName = ComponentProps<typeof Ionicons>["name"];

const FACILITY_CONFIG: { key: string; icon: IonName; color: string; bg: string }[] = [
  { key: "food",       icon: "restaurant-outline",       color: "#EA580C", bg: "#FFF1E6" },
  { key: "living",     icon: "bed-outline",              color: "#2563EB", bg: "#EEF4FF" },
  { key: "travelling", icon: "car-outline",              color: "#059669", bg: "#ECFDF5" },
  { key: "esi_pf",     icon: "shield-checkmark-outline", color: "#7C3AED", bg: "#F5F3FF" },
];

type Props = {
  listings: any[];
  isFetchingNextPage: boolean;
  loadMore: any;
};

const ServiceCard = React.memo(({ item, isLast, userDetails }: any) => {
  const reqs: any[] = Array.isArray(item?.requirements)
    ? item.requirements.slice(0, 2)
    : [];
  const extraReqs = Array.isArray(item?.requirements)
    ? Math.max(0, item.requirements.length - 2)
    : 0;

  const hasPhoto =
    Array.isArray(item?.images) && item.images.length > 0 && Boolean(item.images[0]);
  const heroIcon = getServiceListHeroIcon(item?.type, item?.subType);
  const rawDuration = item?.duration || dateDifference(item?.startDate, item?.endDate);
  const duration = rawDuration
    ? /^\d+$/.test(String(rawDuration).trim())
      ? `${rawDuration} ${Number(rawDuration) === 1 ? t("day") : t("days")}`
      : String(rawDuration)
    : null;
  const activeFacilities = FACILITY_CONFIG.filter((f) => item?.facilities?.[f.key]);
  const serviceTitle = t(item?.subType) || t(item?.type) || t("service");

  const goToDetails = () => {
    if (!item?._id) return;
    router.push({
      pathname: "/screens/service/[id]",
      params: { id: item._id },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={goToDetails}
      style={[styles.card, isLast && styles.cardLast]}
    >
      {/* ── Hero image / icon ── */}
      <View style={styles.imageWrap}>
        {hasPhoto ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} resizeMode="cover" />
        ) : item?.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.iconFallback}>
            {heroIcon.family === "fa5" ? (
              <FontAwesome5 name={heroIcon.name as any} size={44} color={Colors.primary} />
            ) : (
              <Ionicons name={heroIcon.name as any} size={50} color={Colors.primary} />
            )}
          </View>
        )}

        {/* time-ago badge — bottom left */}
        {item?.createdAt ? (
          <View style={styles.timeBadge}>
            <CustomText baseFont={11} fontWeight="700" color={Colors.white}>
              {getTimeAgo(item.createdAt)}
            </CustomText>
          </View>
        ) : null}

        {/* distance badge — top right (replaces bookmark) */}
        <View style={styles.distanceOverlay}>
          <Ionicons name="navigate-outline" size={11} color={Colors.white} />
          <ShowDistance
            address={item?.address}
            loggedInUserLocation={userDetails?.geoLocation ?? userDetails?.location}
            targetLocation={item?.geoLocation}
            align="left"
            color={Colors.white}
            baseFont={11}
          />
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>

        {/* Top meta: title + address + duration */}
        <View style={styles.metaBlock}>
          <CustomHeading textAlign="left" baseFont={15} numberOfLines={1} style={styles.title}>
            {serviceTitle}
          </CustomHeading>

          {item?.address ? (
            <View style={styles.addressRow}>
              <View style={styles.locationDot}>
                <Ionicons name="location-outline" size={13} color={Colors.primary} />
              </View>
              <View style={styles.addressFlex}>
                <ShowAddress
                  address={item?.address}
                  numberOfLines={2}
                  showLeadingPin={false}
                  baseFont={12}
                />
              </View>
            </View>
          ) : null}

          {duration ? (
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={12} color={Colors.subHeading} />
              <CustomText baseFont={11} color={Colors.subHeading} textAlign="left" numberOfLines={1}>
                {duration}
              </CustomText>
            </View>
          ) : null}
        </View>

        {/* Requirements — max 2, separated from meta by divider */}
        {reqs.length > 0 ? (
          <>
            <View style={styles.divider} />
            <View style={styles.reqsWrap}>
              {reqs.map((req: any, idx: number) => (
                <View key={idx} style={styles.reqTag}>
                  <CustomText
                    baseFont={11}
                    fontWeight="700"
                    color={Colors.white}
                    textAlign="left"
                    numberOfLines={1}
                  >
                    {req?.count} {getDynamicWorkerType(req?.name, req?.count)}
                  </CustomText>
                  <CustomText baseFont={10} color="rgba(255,255,255,0.85)" textAlign="left">
                    ₹{req?.payPerDay}/{t("day")}
                  </CustomText>
                </View>
              ))}
              {extraReqs > 0 ? (
                <View style={styles.moreTag}>
                  <CustomText baseFont={11} fontWeight="700" color={Colors.primary}>
                    +{extraReqs} {t("more")}
                  </CustomText>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Facilities pinned to bottom with auto top margin */}
        {activeFacilities.length > 0 ? (
          <View style={styles.facilitiesRow}>
            <Ionicons name="gift-outline" size={11} color={Colors.subHeading} />
            <CustomText baseFont={10} color={Colors.subHeading} fontWeight="700">
              {t("facilities")}:
            </CustomText>
            {activeFacilities.map(({ key, icon, color, bg }) => (
              <View key={key} style={[styles.facilityBadge, { backgroundColor: bg }]}>
                <Ionicons name={icon} size={13} color={color} />
              </View>
            ))}
          </View>
        ) : null}

      </View>
    </TouchableOpacity>
  );
});

ServiceCard.displayName = "ServiceCard";

const ListingHorizontalServices = ({
  listings,
  isFetchingNextPage,
  loadMore,
}: Props) => {
  const userDetails = useAtomValue(Atoms?.UserAtom);
  const debouncedLoadMore = useMemo(() => debounce(loadMore, 300), [loadMore]);

  return (
    <View>
      <FlatList
        data={listings ?? []}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item?._id?.toString()}
        onEndReached={debouncedLoadMore}
        onEndReachedThreshold={0.2}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={3}
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({
          length: CARD_W + 14,
          offset: (CARD_W + 14) * index,
          index,
        })}
        snapToInterval={CARD_W + 14}
        decelerationRate="fast"
        renderItem={({ item, index }) => (
          <ServiceCard
            item={item}
            index={index}
            isLast={index === listings.length - 1}
            userDetails={userDetails}
          />
        )}
        ListFooterComponent={() =>
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default ListingHorizontalServices;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    gap: 14,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    flexDirection: "column",
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.09)",
  },
  cardLast: {
    marginRight: 2,
  },
  /* Image — grows to fill space not used by body */
  imageWrap: {
    flex: 1,
    minHeight: IMG_H_MIN,
    width: "100%",
    backgroundColor: "#EEF4FF",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  iconFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },
  timeBadge: {
    position: "absolute",
    bottom: 8,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  distanceOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  /* Body */
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: {
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  metaBlock: {
    gap: 5,
  },
  /* Address */
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  locationDot: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.12)",
  },
  addressFlex: {
    flex: 1,
    minWidth: 0,
  },
  /* Duration */
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(14, 79, 197, 0.12)",
    marginVertical: 8,
  },
  /* Requirements */
  reqsWrap: {
    flexDirection: "column",
    gap: 5,
  },
  reqTag: {
    backgroundColor: Colors.tertiery,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 1,
  },
  moreTag: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF2FF",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.2)",
  },
  /* Facilities — always at bottom with breathing room above */
  facilitiesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(14, 79, 197, 0.12)",
  },
  facilityBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  footerLoader: {
    width: 50,
    height: CARD_H,
    alignItems: "center",
    justifyContent: "center",
  },
});
