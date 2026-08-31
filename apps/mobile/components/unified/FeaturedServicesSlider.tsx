import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import moment from "moment";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import CustomText from "@/components/commons/CustomText";
import ShowDistance from "@/components/commons/ShowDistance";
import { t } from "@/utils/translationHelper";
import { getDynamicWorkerType } from "@/utils/i18n";
import { isListingFeatureActive } from "@/utils/serviceListingFeature";

const { width: SCREEN_W } = Dimensions.get("window");
/** Matches `contentSurface` paddingHorizontal (10) on the home dashboard. */
const SLIDE_W = SCREEN_W - 20;

type Props = {
  services: any[];
};

function firstRequirement(item: any) {
  const reqs = Array.isArray(item?.requirements) ? item.requirements : [];
  const first = reqs[0];
  const extra = Math.max(0, reqs.length - 1);
  return { first, extra };
}

function durationParts(item: any) {
  const days = Number(item?.duration);
  if (!Number.isFinite(days) || days <= 0) return null;
  return {
    value: String(days),
    unit: days === 1 ? t("day") : t("days"),
  };
}

function startDateLabel(item: any) {
  if (!item?.startDate) return null;
  const parsed = moment(item.startDate);
  if (!parsed.isValid()) return null;
  return parsed.format("DD MMM");
}

const MetaTile = ({
  icon,
  value,
  caption,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: React.ReactNode;
  caption: string;
}) => (
  <View style={styles.metaTile}>
    <View style={styles.metaIconWrap}>
      <Ionicons name={icon} size={13} color="#F5C15A" />
    </View>
    {typeof value === "string" ? (
      <CustomText
        baseFont={13}
        fontWeight="800"
        color="#FFFFFF"
        textAlign="left"
        numberOfLines={1}
      >
        {value}
      </CustomText>
    ) : (
      value
    )}
    <CustomText
      baseFont={9}
      fontWeight="600"
      color="rgba(255,255,255,0.62)"
      textAlign="left"
      numberOfLines={1}
      style={styles.metaCaption}
    >
      {caption}
    </CustomText>
  </View>
);

const FeaturedSlideCard = ({ item }: { item: any }) => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const { first, extra } = firstRequirement(item);
  const duration = durationParts(item);
  const startDate = startDateLabel(item);
  const title = t(item?.subType) || t(item?.type) || t("service");
  const apiDistance =
    typeof item?.distance === "number" && Number.isFinite(item.distance)
      ? Math.round(item.distance * 10) / 10
      : null;

  const goToDetails = () => {
    if (!item?._id) return;
    router.push({
      pathname: "/screens/service/[id]",
      params: { id: item._id },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={goToDetails}
      style={styles.cardShadow}
      accessibilityRole="button"
      accessibilityLabel={`${t("featuredServicesSection")} ${title}`}
    >
      <LinearGradient
        colors={["#122047", "#1A3A8C", "#0E4FC5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.goldEdge} />

        <View style={styles.cardTop}>
          <CustomText
            baseFont={18}
            fontWeight="800"
            color="#FFFFFF"
            textAlign="left"
            numberOfLines={1}
            style={styles.title}
          >
            {title}
          </CustomText>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="rgba(255,255,255,0.72)"
          />
        </View>

        {first ? (
          <View style={styles.reqRow}>
            <View style={styles.reqIcon}>
              <Ionicons name="people" size={15} color="#F5C15A" />
            </View>
            <CustomText
              baseFont={14}
              fontWeight="700"
              color="#FFFFFF"
              textAlign="left"
              numberOfLines={1}
              style={styles.reqText}
            >
              {first?.count} {getDynamicWorkerType(first?.name, first?.count)}
            </CustomText>
            {extra > 0 ? (
              <View style={styles.moreChip}>
                <CustomText baseFont={11} fontWeight="800" color="#F5C15A">
                  +{extra}
                </CustomText>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.metaRow}>
          {duration ? (
            <MetaTile
              icon="time-outline"
              value={`${duration.value} ${duration.unit}`}
              caption={t("duration")}
            />
          ) : null}

          {apiDistance != null ? (
            <MetaTile
              icon="navigate-outline"
              value={`${apiDistance} ${t("kms")}`}
              caption={t("distance")}
            />
          ) : (
            <View style={styles.metaTile}>
              <View style={styles.metaIconWrap}>
                <Ionicons name="navigate-outline" size={13} color="#F5C15A" />
              </View>
              <ShowDistance
                address={item?.address}
                loggedInUserLocation={userDetails?.geoLocation}
                targetLocation={item?.geoLocation}
                align="left"
                color="#FFFFFF"
                baseFont={13}
              />
              <CustomText
                baseFont={9}
                fontWeight="600"
                color="rgba(255,255,255,0.62)"
                textAlign="left"
                numberOfLines={1}
                style={styles.metaCaption}
              >
                {t("distance")}
              </CustomText>
            </View>
          )}

          {startDate ? (
            <MetaTile
              icon="calendar-outline"
              value={startDate}
              caption={t("featuredStartShort")}
            />
          ) : null}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const FeaturedServicesSlider = ({ services }: Props) => {
  const featured = useMemo(
    () =>
      (Array.isArray(services) ? services : []).filter((item) =>
        isListingFeatureActive(item),
      ),
    [services],
  );
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const [paused, setIsPaused] = useState(false);
  const count = featured.length;

  useEffect(() => {
    setActive((prev) => (prev >= count ? 0 : prev));
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % count;
        scrollRef.current?.scrollTo({
          x: next * SLIDE_W,
          animated: true,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Ionicons name="star" size={14} color="#F5C15A" />
        </View>
        <View style={styles.headingText}>
          <CustomText
            baseFont={16}
            fontWeight="800"
            color="#1F2E4D"
            textAlign="left"
          >
            {t("featuredServicesSection")}
          </CustomText>
          <CustomText
            baseFont={11}
            color="#64748B"
            textAlign="left"
            style={styles.headingHint}
          >
            {t("featuredServicesHint")}
          </CustomText>
        </View>
      </View>

      {count === 1 ? (
        <FeaturedSlideCard item={featured[0]} />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={SLIDE_W}
            snapToAlignment="start"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            onMomentumScrollEnd={(e) => {
              const slide = Math.round(
                e.nativeEvent.contentOffset.x / SLIDE_W,
              );
              if (!Number.isNaN(slide)) {
                setActive(Math.max(0, Math.min(slide, count - 1)));
              }
            }}
          >
            {featured.map((item) => (
              <View key={item?._id} style={styles.slide}>
                <FeaturedSlideCard item={item} />
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {featured.map((item, idx) => (
              <View
                key={item?._id || idx}
                style={[styles.dot, idx === active && styles.dotActive]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default FeaturedServicesSlider;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  headingIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF7E0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 193, 90, 0.45)",
  },
  headingText: {
    flex: 1,
    minWidth: 0,
  },
  headingHint: {
    marginTop: 1,
  },
  slide: {
    width: SLIDE_W,
  },
  cardShadow: {
    borderRadius: 22,
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  card: {
    borderRadius: 22,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  goldEdge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#F5C15A",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
    letterSpacing: 0.2,
  },
  reqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  reqIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(245, 193, 90, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  reqText: {
    flex: 1,
    minWidth: 0,
  },
  moreChip: {
    backgroundColor: "rgba(245, 193, 90, 0.16)",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 193, 90, 0.35)",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
  },
  metaTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  metaIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: "rgba(245, 193, 90, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  metaCaption: {
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(14, 79, 197, 0.22)",
  },
  dotActive: {
    width: 16,
    backgroundColor: "#0E4FC5",
  },
});
