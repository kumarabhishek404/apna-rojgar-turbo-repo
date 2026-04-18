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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import coverImage from "../../assets/images/placeholder-cover.jpg";
import { debounce } from "lodash";
import RatingAndReviews from "./RatingAndReviews";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import ShowAddress from "./ShowAddress";
import UserRoleTag from "./UserRoleTag";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import ShowDistance from "./ShowDistance";

const CARD_W = 220;
const CARD_H = 310;
const AVATAR_H = 120;
const MAX_SKILLS = 2;

type Props = {
  availableInterest: any;
  listings: any[];
  isFetchingNextPage: boolean;
  loadMore: any;
};

const getSkillLabel = (skill: any): string => {
  if (typeof skill === "string") return skill;
  if (skill && typeof skill === "object") return skill.skill ?? skill.name ?? "";
  return "";
};

const WorkerCard = React.memo(({ item, isLast, userDetails }: any) => {
  const rawSkills: any[] = Array.isArray(item?.skills) ? item.skills : [];
  const visibleSkills = rawSkills.slice(0, MAX_SKILLS);
  const extraSkills = Math.max(0, rawSkills.length - MAX_SKILLS);

  const goToDetails = () => {
    if (!item?._id) return;
    router.push({
      pathname: "/screens/users/[id]",
      params: { id: item._id, title: "workerDetails" },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={goToDetails}
      style={[styles.card, isLast && styles.cardLast]}
    >
      {/* ── Hero photo ── */}
      <View style={styles.photoWrap}>
        <Image
          source={item?.profilePicture ? { uri: item.profilePicture } : coverImage}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* bookmark heart */}
        {item?.isBookmarked ? (
          <View style={styles.heartBtn}>
            <Ionicons name="heart" size={16} color={Colors.white} />
          </View>
        ) : null}

        {/* distance badge bottom-left */}
        <View style={styles.distanceBadge}>
          <Ionicons name="navigate-outline" size={11} color={Colors.white} />
          <ShowDistance
            address={item?.address}
            loggedInUserLocation={
              userDetails?.geoLocation ?? userDetails?.location
            }
            targetLocation={item?.geoLocation}
            align="left"
            color={Colors.white}
            baseFont={11}
          />
        </View>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Name + role */}
        <CustomHeading
          textAlign="left"
          baseFont={15}
          numberOfLines={1}
          style={styles.name}
        >
          {item?.name}
        </CustomHeading>

        <View style={styles.roleRow}>
          <UserRoleTag user={item} variant="compact" />
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <View style={styles.locationIconWrap}>
            <Ionicons name="location-outline" size={14} color={Colors.primary} />
          </View>
          <View style={styles.addressText}>
            <ShowAddress
              address={item?.address}
              numberOfLines={1}
              showLeadingPin={false}
              baseFont={12}
            />
          </View>
        </View>

        {/* Skills — max 2 */}
        {visibleSkills.length > 0 ? (
          <View style={styles.skillsRow}>
            {visibleSkills.map((skill: any, idx: number) => (
              <View key={idx} style={styles.skillPill}>
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={11}
                  color={Colors.primary}
                />
                <CustomText
                  baseFont={11}
                  fontWeight="700"
                  color={Colors.primary}
                  textAlign="left"
                  numberOfLines={1}
                >
                  {getSkillLabel(skill)}
                </CustomText>
              </View>
            ))}
            {extraSkills > 0 ? (
              <View style={styles.morePill}>
                <CustomText baseFont={11} fontWeight="700" color={Colors.primary}>
                  +{extraSkills}
                </CustomText>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Rating footer */}
        <View style={styles.footer}>
          <View style={styles.ratingWrap}>
            <RatingAndReviews
              rating={item?.rating?.average ?? item?.rating ?? 0}
              reviews={item?.rating?.count ?? item?.reviews ?? 0}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

WorkerCard.displayName = "WorkerCard";

const ListingHorizontalWorkers = ({
  availableInterest,
  listings,
  loadMore,
  isFetchingNextPage,
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
        renderItem={({ item, index }) => (
          <WorkerCard
            item={item}
            index={index}
            isLast={index === listings.length - 1}
            userDetails={userDetails}
            availableInterest={availableInterest}
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

export default ListingHorizontalWorkers;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    gap: 14,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.09)",
  },
  cardLast: {
    marginRight: 2,
  },
  photoWrap: {
    width: "100%",
    height: AVATAR_H,
    position: "relative",
    backgroundColor: Colors.secondaryBackground,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.primary,
    padding: 7,
    borderRadius: 20,
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  distanceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  body: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 5,
  },
  name: {
    letterSpacing: 0.1,
  },
  roleRow: {
    alignSelf: "flex-start",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: Colors.secondaryBackground,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.1)",
    flexShrink: 0,
  },
  addressText: {
    flex: 1,
    minWidth: 0,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
  },
  skillPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF4FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.12)",
    maxWidth: "100%",
  },
  morePill: {
    backgroundColor: "#EAF2FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(34, 64, 154, 0.12)",
  },
  ratingWrap: {
    backgroundColor: "#FFFBF0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 164, 28, 0.3)",
  },
  footerLoader: {
    width: 50,
    height: CARD_H,
    alignItems: "center",
    justifyContent: "center",
  },
});
