import React from "react";
import { View, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
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
        <Feather name="headphones" size={22} color="#F97316" />
      </View>
      <CustomText textAlign="center" baseFont={15} color="#7C2D12">
        {t("supportTitle")}
      </CustomText>

      <CustomText textAlign="center" baseFont={15} fontWeight="700" color="#431407">
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
          <FontAwesome name="whatsapp" size={26} color="#fff" />
          <CustomText color="#fff" fontWeight="700" baseFont={16}>
            {t("whatsappUs")}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    backgroundColor: "#FFF7ED",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FED7AA",
    shadowColor: "#9A3412",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  actions: {
    marginTop: 10,
    width: "100%",
    gap: 12,
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
    paddingVertical: 15,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
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
