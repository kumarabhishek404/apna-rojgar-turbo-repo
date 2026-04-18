import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";

interface SocialItem {
  id: string;
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  iconBg: string;
  url: string;
}

const SOCIAL_ITEMS: SocialItem[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    subLabel: "Join our group",
    icon: <FontAwesome5 name="whatsapp" size={22} color="#25D366" />,
    bg: "#F0FBF3",
    border: "#B2ECC0",
    iconBg: "#DCF8E6",
    url: "https://chat.whatsapp.com/E5IuGZ8EXJR5ZO490tlfoD?mode=gi_t",
  },
  {
    id: "instagram",
    label: "Instagram",
    subLabel: "Follow us",
    icon: <FontAwesome5 name="instagram" size={22} color="#E1306C" />,
    bg: "#FFF1F5",
    border: "#F7B8CC",
    iconBg: "#FFE0EA",
    url: "https://instagram.com/apnarojgarindia",
  },
  {
    id: "threads",
    label: "Threads",
    subLabel: "Follow us",
    icon: <MaterialCommunityIcons name="at" size={22} color="#101010" />,
    bg: "#F5F5F5",
    border: "#D4D4D4",
    iconBg: "#E8E8E8",
    url: "https://threads.net/@apnarojgarindia",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    subLabel: "Connect with us",
    icon: <FontAwesome5 name="linkedin" size={22} color="#0A66C2" />,
    bg: "#EFF6FF",
    border: "#BFDBFE",
    iconBg: "#DBEAFE",
    url: "https://linkedin.com/company/apnarojgar",
  },
  {
    id: "facebook",
    label: "Facebook",
    subLabel: "Like our page",
    icon: <FontAwesome5 name="facebook" size={22} color="#1877F2" />,
    bg: "#EFF6FF",
    border: "#BFDBFE",
    iconBg: "#DBEAFE",
    url: "https://facebook.com/apnarojgarindia",
  },
  {
    id: "website",
    label: "Website",
    subLabel: "Visit us",
    icon: <Ionicons name="globe-outline" size={22} color="#6366F1" />,
    bg: "#F5F3FF",
    border: "#C4B5FD",
    iconBg: "#EDE9FE",
    url: "https://apnarojgar.in",
  },
  {
    id: "playstore",
    label: "Download App",
    subLabel: "Get on Play Store",
    icon: <MaterialCommunityIcons name="google-play" size={22} color="#01875F" />,
    bg: "#F0FBF3",
    border: "#B2ECC0",
    iconBg: "#D4F5E2",
    url: Platform.OS === "android"
      ? "market://details?id=com.apnarojgar"
      : "https://play.google.com/store/apps/details?id=com.apnarojgar",
  },
];

const openLink = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  } catch (e) {
    console.warn("Cannot open URL:", url);
  }
};

const SocialLinks = () => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <CustomHeading baseFont={15} textAlign="left">
          Connect with us
        </CustomHeading>
      </View>
      <View style={styles.grid}>
        {SOCIAL_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: item.bg, borderColor: item.border }]}
            onPress={() => openLink(item.url)}
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
