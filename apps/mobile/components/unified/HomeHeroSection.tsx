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

import Atoms from "@/app/AtomStore";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import homeBannerArt from "../../assets/banners/banner1.png";
import homeBannerArt2 from "../../assets/banners/banner2.png";
import homeBannerArt3 from "../../assets/banners/banner3.png";
import homeBannerArt4 from "../../assets/banners/banner4.png";
import homeBannerArt5 from "../../assets/banners/banner5.png";
import homeBannerArt6 from "../../assets/banners/banner6.png";

const { width: SCREEN_W } = Dimensions.get("window");
/** Horizontal padding on gradientBlock (22 * 2). */
const BANNER_HORIZONTAL_INSET = 44;
/** Banner assets are ~2:1 (e.g. 1774×887). Keep full artwork visible. */
const BANNER_ASPECT_RATIO = 2;
const BANNER_SLIDE_W = SCREEN_W - BANNER_HORIZONTAL_INSET;
const BANNER_IMAGE_H = Math.round(BANNER_SLIDE_W / BANNER_ASPECT_RATIO);
const BANNER_BOTTOM_MARGIN = 12;

type Props = {
  userDetails: {
    name?: string;
  } | null;
};

function firstName(full?: string): string {
  if (!full || typeof full !== "string") return "";
  const p = full.trim().split(/\s+/)[0];
  return p || "";
}

const HomeHeroSection = ({ userDetails }: Props) => {
  const notificationCount = useAtomValue(Atoms.notificationCount) as number;
  const bannerScrollRef = useRef<ScrollView>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const bannerImages = useMemo(() => [homeBannerArt, homeBannerArt2, homeBannerArt3, homeBannerArt4, homeBannerArt5, homeBannerArt6], []);

  const displayName =
    firstName(userDetails?.name) || t("homeGreetingFallbackName");

  const onNotifications = () => {
    router.push({
      pathname: "/screens/notifications",
      params: { title: "notifications", type: "all" },
    });
  };

  useEffect(() => {
    if (bannerImages.length <= 1 || isPaused) return; // Don't start/continue timer if paused

    const id = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % bannerImages.length;
        bannerScrollRef.current?.scrollTo({
          x: next * BANNER_SLIDE_W,
          animated: true,
        });
        return next;
      });
    }, 3200);

    return () => clearInterval(id);
  }, [bannerImages.length, isPaused]); // Re-run effect when isPaused changes

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBlock, { paddingTop: 12 }]}
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
            <Ionicons name="notifications-outline" size={26} color="#3F4F82" />
            {notificationCount > 0 ? <View style={styles.bellDot} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.bannerCard}>
          <ScrollView
            ref={bannerScrollRef}
            style={styles.bannerScroll}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={BANNER_SLIDE_W}
            snapToAlignment="start"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            onMomentumScrollEnd={(e) => {
              const slide = Math.round(
                e.nativeEvent.contentOffset.x / BANNER_SLIDE_W,
              );
              if (!Number.isNaN(slide)) {
                setActiveBanner(
                  Math.max(0, Math.min(slide, bannerImages.length - 1)),
                );
              }
            }}
          >
            {bannerImages.map((img, idx) => (
              <View key={idx} style={styles.bannerSlide}>
                <Image
                  source={img}
                  style={styles.bannerCoverImage}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>
            ))}
          </ScrollView>
        </View>
        {bannerImages.length > 1 ? (
          <View style={styles.bannerDots}>
            {bannerImages.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.bannerDot,
                  idx === activeBanner && styles.bannerDotActive,
                ]}
              />
            ))}
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: SCREEN_W,
    marginHorizontal: -16,
    marginBottom: 8,
  },
  gradientBlock: {
    paddingHorizontal: 22,
    paddingBottom: 20,
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
    width: BANNER_SLIDE_W,
    height: BANNER_IMAGE_H,
    marginBottom: BANNER_BOTTOM_MARGIN,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#1f3f9a",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bannerScroll: {
    width: BANNER_SLIDE_W,
    height: BANNER_IMAGE_H,
  },
  bannerSlide: {
    width: BANNER_SLIDE_W,
    height: BANNER_IMAGE_H,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  bannerCoverImage: {
    width: "100%",
    height: "100%",
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(156, 150, 150, 0.55)",
  },
  bannerDotActive: {
    width: 14,
    backgroundColor: "#000",
  },
});

export default HomeHeroSection;
