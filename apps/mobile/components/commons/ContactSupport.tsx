import React from "react";
import { View, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";

const SUPPORT_PHONE = "+916397308499";
const SUPPORT_WHATSAPP = "916397308499";

export default function ContactSupport() {
  const openDialer = () => Linking.openURL(`tel:${SUPPORT_PHONE}`);

  const openWhatsApp = () =>
    Linking.openURL(
      `https://wa.me/${SUPPORT_WHATSAPP}?text=${t("supportWhatsappMessage")}`,
    );

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Feather name="headphones" size={17} color={Colors.primary} />
      </View>
      <CustomText textAlign="center" baseFont={12} color="#DCE7FF">
        {t("supportTitle")}
      </CustomText>

      <CustomText
        textAlign="center"
        baseFont={13}
        fontWeight="700"
        color={Colors.white}
      >
        {t("supportSubtitle")}
      </CustomText>

      <View style={styles.actions}>
        {/* <TouchableOpacity style={styles.callBtn} onPress={openDialer}>
          <Feather name="phone-call" size={22} color="#fff" />
          <CustomText color="#fff" fontWeight="700" baseFont={16}>
            {t("callUs")}
          </CustomText>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.whatsappBtn} onPress={openWhatsApp}>
          <FontAwesome name="whatsapp" size={21} color="#fff" />
          <CustomText color="#fff" fontWeight="700" baseFont={14}>
            {t("whatsappUs")}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: "center",
    gap: 5,
    width: "92%",
    alignSelf: "center",
  },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  actions: {
    marginTop: 6,
    width: "100%",
    gap: 8,
  },

  callBtn: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  whatsappBtn: {
    flexDirection: "row",
    backgroundColor: "#22C55E",
    alignSelf: "center",
    minWidth: 230,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  emailBtn: {
    flexDirection: "row",
    backgroundColor: "#F97316",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
});
