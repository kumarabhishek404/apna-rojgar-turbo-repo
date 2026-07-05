import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Share,
} from "react-native";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import { APPLINK } from "@/constants";
import { SOCIAL_LINKS } from "@/constants/socialLinks";
import { t } from "@/utils/translationHelper";
import {
  openExternalLink,
  openInstagramProfile,
  openPlayStore,
} from "@/utils/openExternalLink";

interface SocialItem {
  id: string;
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconBg: string;
  onPress: () => void | Promise<void>;
}

const shareAppLink = async () => {
  try {
    await Share.share({
      message: t("shareAppMessage", { appLink: APPLINK }),
      url: APPLINK,
    });
  } catch (e) {
    console.warn("Share failed", e);
  }
};

const SocialLinks = () => {
  const SOCIAL_ITEMS: SocialItem[] = [
    {
      id: "whatsapp",
      label: t("whatsapp"),
      subLabel: t("whatsappSub"),
      icon: <FontAwesome5 name="whatsapp" size={22} color="#25D366" />,
      bg: "#F0FBF3",
      border: "#B2ECC0",
      iconBg: "#DCF8E6",
      onPress: () => openExternalLink(SOCIAL_LINKS.whatsappGroup),
    },
    {
      id: "instagram",
      label: t("instagram"),
      subLabel: t("followUs"),
      icon: <FontAwesome5 name="instagram" size={22} color="#E1306C" />,
      bg: "#FFF1F5",
      border: "#F7B8CC",
      iconBg: "#FFE0EA",
      onPress: () => openInstagramProfile(SOCIAL_LINKS.instagram),
    },
    {
      id: "threads",
      label: t("threads"),
      subLabel: t("followUs"),
      icon: <MaterialCommunityIcons name="at" size={22} color="#101010" />,
      bg: "#F5F5F5",
      border: "#D4D4D4",
      iconBg: "#E8E8E8",
      onPress: () => openExternalLink(SOCIAL_LINKS.threads),
    },
    {
      id: "linkedin",
      label: t("linkedin"),
      subLabel: t("connect"),
      icon: <FontAwesome5 name="linkedin" size={22} color="#0A66C2" />,
      bg: "#EFF6FF",
      border: "#BFDBFE",
      iconBg: "#DBEAFE",
      onPress: () => openExternalLink(SOCIAL_LINKS.linkedin),
    },
    {
      id: "facebook",
      label: t("facebook"),
      subLabel: t("likePage"),
      icon: <FontAwesome5 name="facebook" size={22} color="#1877F2" />,
      bg: "#EFF6FF",
      border: "#BFDBFE",
      iconBg: "#DBEAFE",
      onPress: () => openExternalLink(SOCIAL_LINKS.facebook),
    },
    {
      id: "website",
      label: t("website"),
      subLabel: t("visit"),
      icon: <Ionicons name="globe-outline" size={22} color="#6366F1" />,
      bg: "#F5F3FF",
      border: "#C4B5FD",
      iconBg: "#EDE9FE",
      onPress: () => openExternalLink(SOCIAL_LINKS.website),
    },
    {
      id: "playstore",
      label: t("downloadApp"),
      subLabel: t("playStore"),
      icon: (
        <MaterialCommunityIcons name="google-play" size={22} color="#01875F" />
      ),
      bg: "#F0FBF3",
      border: "#B2ECC0",
      iconBg: "#D4F5E2",
      onPress: () => openPlayStore(),
    },
    {
      id: "share",
      label: t("shareApp"),
      subLabel: t("shareLink"),
      icon: (
        <MaterialCommunityIcons
          name="share-variant"
          size={22}
          color="#0E4FC5"
        />
      ),
      bg: "#EAF2FF",
      border: "#BFDBFE",
      iconBg: "#DBEAFE",
      onPress: () => shareAppLink(),
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <CustomHeading baseFont={15} textAlign="left">
          {t("connectTitle")}
        </CustomHeading>
      </View>
      <View style={styles.grid}>
        {SOCIAL_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: item.bg, borderColor: item.border },
            ]}
            onPress={item.onPress}
            activeOpacity={0.75}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
              {item.icon}
            </View>
            <CustomHeading baseFont={13} textAlign="left" style={styles.label}>
              {item.label}
            </CustomHeading>
            <CustomText baseFont={11} color="#6B7280" textAlign="left">
              {item.subLabel}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  headerRow: {
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "flex-start",
    gap: 6,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 2,
  },
});

export default SocialLinks;
