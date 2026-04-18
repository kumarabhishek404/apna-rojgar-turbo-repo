import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtomValue } from "jotai";

import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import CustomText from "@/components/commons/CustomText";
import ProfilePicture from "@/components/commons/ProfilePicture";
import { WORKERTYPES } from "@/constants";
import { getWorkLabel } from "@/constants/functions";
import { t } from "@/utils/translationHelper";
import homeBannerArt from "../../assets/banners/banner1.jpg";

const { width: SCREEN_W } = Dimensions.get("window");

type Props = {
  userDetails: {
    _id?: string;
    name?: string;
    profilePicture?: string;
    createdAt?: string;
    role?: string;
    mobile?: string | number;
    skills?: Array<{ skill?: string } | string>;
  } | null;
};

function daysSinceJoin(createdAt?: string): number {
  if (!createdAt) return 0;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function firstName(full?: string): string {
  if (!full || typeof full !== "string") return "";
  const p = full.trim().split(/\s+/)[0];
  return p || "";
}

function labelForApiRole(role?: string): string {
  const r = String(role || "").toUpperCase();
  if (r === "EMPLOYER") return t("roleTagEmployer");
  if (r === "MEDIATOR") return t("mediator");
  if (r === "WORKER") return t("roleTagLabour");
  return r ? String(role) : t("notAdded");
}

const HomeHeroSection = ({ userDetails }: Props) => {
  const notificationCount = useAtomValue(Atoms.notificationCount) as number;
  const bannerScrollRef = useRef<ScrollView>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  const bannerImages = useMemo(() => [homeBannerArt], []);

  const displayName = firstName(userDetails?.name) || t("homeGreetingFallbackName");
  const memberDays = daysSinceJoin(userDetails?.createdAt);

  const mobileDisplay = useMemo(() => {
    const m = userDetails?.mobile;
    if (m === undefined || m === null || m === "") return t("notAdded");
    return String(m).trim();
  }, [userDetails?.mobile]);

  const skillItems = useMemo(() => {
    const raw = userDetails?.skills;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw
      .map((s) => {
        const v = typeof s === "string" ? s : s?.skill;
        if (!v || typeof v !== "string") return "";
        const label = getWorkLabel(WORKERTYPES, v.trim());
        return label || v.trim();
      })
      .filter(Boolean) as string[];
  }, [userDetails?.skills]);

  const onProfile = () => {
    router.push({ pathname: "/screens/profile" });
  };

  const onNotifications = () => {
    router.push({
      pathname: "/screens/notifications",
      params: { title: "notifications", type: "all" },
    });
  };

  useEffect(() => {
    if (bannerImages.length <= 1) return;
    const id = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % bannerImages.length;
        bannerScrollRef.current?.scrollTo({
          x: next * (SCREEN_W - 44),
          animated: true,
        });
        return next;
      });
    }, 3200);
    return () => clearInterval(id);
  }, [bannerImages.length]);

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBlock, { paddingTop: 8 }]}
      >
        <View style={styles.topRow}>
          <View style={styles.greetingBlock}>
            <CustomText
              baseFont={16}
              fontWeight="600"
              color="rgba(61, 77, 116, 0.85)"
              textAlign="left"
              style={styles.greetingLine}
            >
              {t("homeGreetingHi", { name: displayName })}
            </CustomText>
            <CustomText
              baseFont={24}
              fontWeight="700"
              color="#2B315A"
              textAlign="left"
              style={styles.welcomeLine}
            >
              {t("homeWelcomeBack")}
            </CustomText>
          </View>
          <TouchableOpacity
            onPress={onNotifications}
            style={styles.bellWrap}
            accessibilityRole="button"
            accessibilityLabel={t("notifications")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name="notifications-outline"
              size={26}
              color="#3F4F82"
            />
            {notificationCount > 0 ? <View style={styles.bellDot} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.bannerCard}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const slide = Math.round(
                e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width,
              );
              if (!Number.isNaN(slide)) setActiveBanner(slide);
            }}
          >
            {bannerImages.map((img, idx) => (
              <Image
                key={idx}
                source={img}
                style={styles.bannerCoverImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ))}
          </ScrollView>
          {bannerImages.length > 1 ? (
            <View style={styles.bannerDots}>
              {bannerImages.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.bannerDot, idx === activeBanner && styles.bannerDotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View style={styles.whiteCurve}>
        <View style={styles.profileRow}>
          <View style={styles.heroAvatarWrap}>
            <ProfilePicture
              uri={userDetails?.profilePicture}
              style={styles.heroAvatar}
            />
          </View>

          <View style={styles.profileInfo}>
            {/* Name row: name left, Full Details button right */}
            <View style={styles.nameRow}>
              {userDetails?.name ? (
                <CustomText
                  fontWeight="800"
                  baseFont={18}
                  color="#1A2340"
                  numberOfLines={1}
                  style={styles.profileName}
                  textAlign="left"
                >
                  {userDetails.name}
                </CustomText>
              ) : null}
              <TouchableOpacity
                onPress={onProfile}
                style={styles.fullDetailsBtn}
                accessibilityRole="button"
                accessibilityLabel="Full Details"
                activeOpacity={0.9}
              >
                <CustomText baseFont={12} fontWeight="800" color={Colors.white}>
                  Full Details
                </CustomText>
                <Ionicons name="arrow-forward" size={14} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Mobile + Role inline */}
            <View style={styles.metaCompactRow}>
              <CustomText
                baseFont={15}
                fontWeight="600"
                color="#2D2A44"
                numberOfLines={1}
                textAlign="left"
              >
                {mobileDisplay}
              </CustomText>
              <View style={styles.roleBadge}>
                <CustomText
                  baseFont={12}
                  fontWeight="800"
                  color="#FFFFFF"
                  numberOfLines={1}
                  textAlign="center"
                >
                  {labelForApiRole(userDetails?.role)}
                </CustomText>
              </View>
            </View>

            {/* Skills as distinct solid colored tags */}
            {skillItems.length > 0 ? (
              <View style={styles.skillsWrap}>
                {skillItems.map((skill, idx) => {
                  const tone = SKILL_TONES[idx % SKILL_TONES.length];
                  return (
                    <View
                      key={`${skill}-${idx}`}
                      style={[styles.skillTag, { backgroundColor: tone.bg }]}
                    >
                      <View style={[styles.skillDot, { backgroundColor: tone.dot }]} />
                      <CustomText
                        baseFont={12}
                        fontWeight="700"
                        color={tone.text}
                        numberOfLines={1}
                        textAlign="left"
                      >
                        {skill}
                      </CustomText>
                    </View>
                  );
                })}
              </View>
            ) : null}

          </View>
        </View>
        <View style={styles.separator} />
      </View>
    </View>
  );
};

const HERO_AV = 76;

const SKILL_TONES = [
  { bg: "#DBEAFE", dot: "#2563EB", text: "#1D4ED8" },
  { bg: "#D1FAE5", dot: "#059669", text: "#065F46" },
  { bg: "#FEF3C7", dot: "#D97706", text: "#92400E" },
  { bg: "#EDE9FE", dot: "#7C3AED", text: "#5B21B6" },
  { bg: "#FCE7F3", dot: "#DB2777", text: "#9D174D" },
];

const styles = StyleSheet.create({
  wrap: {
    width: SCREEN_W,
    marginHorizontal: -16,
    marginBottom: 8,
  },
  gradientBlock: {
    paddingHorizontal: 22,
    paddingBottom: 46,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: 14,
  },
  greetingLine: {
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  welcomeLine: {
    marginTop: 2,
    letterSpacing: 0.15,
    lineHeight: 33,
  },
  bellWrap: {
    position: "relative",
    padding: 4,
    marginTop: -2,
  },
  bellDot: {
    position: "absolute",
    top: 3,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E5658C",
    borderWidth: 2,
    borderColor: "#F5F2FF",
  },
  bannerCard: {
    borderRadius: 26,
    height: 172,
    overflow: "hidden",
    backgroundColor: "#2D47B3",
    marginBottom: 16,
    shadowColor: "#1f3f9a",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bannerCoverImage: {
    width: SCREEN_W - 44,
    height: "100%",
    opacity: 0.97,
  },
  bannerDots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  bannerDotActive: {
    width: 14,
    backgroundColor: "#FFFFFF",
  },
  whiteCurve: {
    marginTop: 0,
    backgroundColor: "#EEF4FF",
    paddingTop: 18,
    paddingBottom: 0,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    gap: 12,
  },
  heroAvatarWrap: {
    borderRadius: HERO_AV / 2,
    borderWidth: 4,
    borderColor: "#FAFAFF",
    backgroundColor: "#FAFAFF",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 2,
  },
  heroAvatar: {
    width: HERO_AV,
    height: HERO_AV,
    borderRadius: HERO_AV / 2,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 10,
    paddingRight: 4,
  },
  profileName: {
    marginBottom: 0,
  },
  metaCompactRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  roleBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#0E4FC5",
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  skillsCard: {
    borderRadius: 12,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.12)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fullDetailsBtn: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E4FC5",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    flexShrink: 0,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(14, 79, 197, 0.22)',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 0,
  },
});

export default HomeHeroSection;
