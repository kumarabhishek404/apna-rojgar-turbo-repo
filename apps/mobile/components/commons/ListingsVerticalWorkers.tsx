import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import React, { useCallback, useMemo, useRef, type ReactElement } from "react";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import coverImage from "../../assets/images/placeholder-cover.jpg";
import RatingAndReviews from "./RatingAndReviews";
import SkillSelector from "./SkillSelector";
import CustomHeading from "./CustomHeading";
import ShowDistance from "./ShowDistance";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import ShowAddress from "./ShowAddress";
import CustomText from "./CustomText";
import { handleCall } from "@/constants/functions";
import { t } from "@/utils/translationHelper";

const getListingPhone = (item: any): string =>
  String(item?.mobile ?? item?.phone ?? item?.phoneNumber ?? "").trim();

/** Space below last item — tab bar / scroll comfort; loader sits above this. */
const LIST_BOTTOM_INSET = 250;

const dedupeByStableId = (rows: any[]) => {
  const seen = new Set<string>();
  const output: any[] = [];

  for (const item of Array.isArray(rows) ? rows : []) {
    if (!item || typeof item !== "object") continue;
    const key = String(item?._id ?? item?.id ?? item?.user ?? "");
    if (!key) {
      output.push(item);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
};

type ListingsVerticalWorkersProps = {
  availableInterest: any;
  listings: any[];
  loadMore: () => void;
  isFetchingNextPage: boolean;
  refreshControl?: any;
  type: string;
  ListHeaderComponent?: ReactElement | null;
  /** Optional wrapper style (e.g. flexGrow) for embedded screens */
  style?: StyleProp<ViewStyle>;
  /** Passed through from older screens; unused */
  category?: string;
};

const ListingsVerticalWorkers = ({
  availableInterest,
  listings,
  loadMore,
  isFetchingNextPage,
  refreshControl,
  type,
  ListHeaderComponent,
  style,
}: ListingsVerticalWorkersProps) => {
  const userDetails = useAtomValue(Atoms?.UserAtom);
  const stableListings = useMemo(() => dedupeByStableId(listings), [listings]);

  const onEndReachedCalledDuringMomentum = useRef(false);
  const renderItem = useCallback(
    ({ item }: any) => {
      const phone = getListingPhone(item);
      const callLabel =
        type === "mediator" ? t("callMediator") : t("callWorker");

      return (
      <View style={styles.rowWrap}>
        <TouchableOpacity
          activeOpacity={0.92}
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/screens/users/[id]",
              params: {
                id: item?._id,
                role: type,
                title: "workerDetails",
              },
            })
          }
          style={styles.cardTouchable}
        >
          <View style={styles.item}>
            <View style={styles.itemInner}>
              <View style={styles.mainRow}>
                <View style={styles.avatarColumn}>
                  <Image
                    source={
                      item?.profilePicture
                        ? { uri: item.profilePicture }
                        : coverImage
                    }
                    style={styles.avatar}
                  />
                  {phone ? (
                    <TouchableOpacity
                      style={styles.callButton}
                      activeOpacity={0.72}
                      accessibilityRole="button"
                      accessibilityLabel={callLabel}
                      onPress={() =>
                        handleCall(phone, {
                          source: "listing_vertical",
                          viewedUserId: String(item?._id ?? ""),
                        })
                      }
                    >
                      <View style={styles.callIconCircle}>
                        <Ionicons name="call" size={14} color={Colors.white} />
                      </View>
                      <CustomText
                        baseFont={13}
                        color={Colors.primary}
                        numberOfLines={1}
                        style={styles.callButtonLabel}
                      >
                        {t("listingCall")}
                      </CustomText>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.cardContent}>
                  <CustomHeading textAlign="left" style={styles.workerName}>
                    {item?.name}
                  </CustomHeading>

                  <View style={styles.addressMetaRow}>
                    <View style={styles.metaIconBadge}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.addressTextWrap}>
                      <ShowAddress
                        address={item?.address}
                        numberOfLines={2}
                        showLeadingPin={false}
                        baseFont={14}
                      />
                    </View>
                  </View>

                  <SkillSelector
                    canAddSkills={false}
                    isShowLabel={false}
                    style={styles.skillsContainer}
                    tagStyle={styles.skillTag}
                    tagTextStyle={styles.skillTagText}
                    userSkills={item?.skills}
                    availableSkills={availableInterest}
                    count={3}
                  />
                </View>
              </View>

              <View style={styles.footerCard}>
                <View style={styles.footerInner}>
                  <View style={styles.ratingPill}>
                    <RatingAndReviews
                      rating={item?.rating?.average}
                      reviews={item?.rating?.count}
                    />
                  </View>
                  <View style={styles.distancePill}>
                    <ShowDistance
                      address={item?.address}
                      loggedInUserLocation={userDetails?.geoLocation}
                      targetLocation={item?.geoLocation}
                      align="right"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
      );
    },
    [availableInterest, type, userDetails?.geoLocation, userDetails?.location],
  );

  const keyExtractor = useCallback((item: any, index: number) => {
    const stableId = item?._id ?? item?.id ?? item?.user;
    return stableId ? String(stableId) : `worker-row-${index}`;
  }, []);

  const handleEndReached = () => {
    if (!onEndReachedCalledDuringMomentum.current) {
      loadMore();
      onEndReachedCalledDuringMomentum.current = true;
    }
  };

  const handleMomentum = () => {
    onEndReachedCalledDuringMomentum.current = false;
  };

  return (
    <View style={[styles.listRoot, style]}>
      <FlatList
        style={styles.flatList}
        data={stableListings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent ?? undefined}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.25}
        onMomentumScrollBegin={handleMomentum}
        ListFooterComponent={
          <View style={styles.listFooter}>
            {isFetchingNextPage ? (
              <View style={styles.paginationLoader}>
                <ActivityIndicator size="large" color={Colors?.primary} />
              </View>
            ) : null}
            <View style={styles.listBottomInset} />
          </View>
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={60}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={refreshControl}
      />
    </View>
  );
};

export default ListingsVerticalWorkers;

const styles = StyleSheet.create({
  listRoot: {
    flex: 1,
    minHeight: 0,
  },
  flatList: {
    flex: 1,
  },
  rowWrap: {
    flex: 1,
  },
  cardTouchable: {
    borderRadius: 16,
  },
  item: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.1)",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: "hidden",
    position: "relative",
  },
  accentBar: {
    height: 3,
    width: "100%",
    backgroundColor: Colors.primary,
  },
  itemInner: {
    padding: 14,
    paddingTop: 12,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarColumn: {
    width: 80,
    marginRight: 12,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 100,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: Colors.secondaryBackground,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  callButton: {
    marginTop: 8,
    width: "100%",
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.22)",
    backgroundColor: "#EEF4FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  callIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  callButtonLabel: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  workerName: {
    marginBottom: 8,
  },
  addressMetaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 2,
  },
  metaIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.secondaryBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.1)",
    marginTop: 2,
  },
  addressTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  skillsContainer: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillTag: {
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.12)",
  },
  skillTagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "700",
  },
  footerCard: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(34, 64, 154, 0.12)",
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  ratingPill: {
    flexShrink: 0,
    backgroundColor: "#FFFBF0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 164, 28, 0.35)",
  },
  distancePill: {
    flexShrink: 0,
    backgroundColor: "rgba(34, 64, 154, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.14)",
  },
  separator: {
    height: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  listFooter: {
    width: "100%",
  },
  paginationLoader: {
    paddingTop: 8,
    paddingBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  listBottomInset: {
    width: "100%",
    height: LIST_BOTTOM_INSET,
  },
});
