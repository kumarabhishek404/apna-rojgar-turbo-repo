import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";

interface PromotionChoiceModalProps {
  visible: boolean;
  amount: number;
  loading?: boolean;
  onClose: () => void;
  onPromote: () => void;
  onSubmitWithoutPromotion: () => void;
}

const PromotionChoiceModal: React.FC<PromotionChoiceModalProps> = ({
  visible,
  amount,
  loading = false,
  onClose,
  onPromote,
  onSubmitWithoutPromotion,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t("cancel")}
          >
            <Ionicons name="close" size={22} color={Colors.subHeading} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Ionicons name="megaphone-outline" size={28} color={Colors.primary} />
          </View>

          <CustomHeading baseFont={20} fontWeight="800" style={styles.title}>
            {t("promotionModalTitle")}
          </CustomHeading>

          <CustomText color={Colors.subHeading} style={styles.subtitle}>
            {t("promotionModalSubtitle")}
          </CustomText>

          <View style={styles.benefitBox}>
            <Ionicons name="megaphone" size={18} color={Colors.primary} />
            <CustomText textAlign="left" baseFont={13} color={Colors.subHeading} style={styles.benefitText}>
              {t("promotionModalBenefit")}
            </CustomText>
          </View>

          {(process.env.EXPO_PUBLIC_CASHFREE_ENV || "SANDBOX").toUpperCase() !== "PRODUCTION" ? (
            <View style={styles.sandboxBox}>
              <CustomText textAlign="left" baseFont={12} fontWeight="800" color="#92400E">
                {t("cashfreeSandboxTitle")}
              </CustomText>
              <CustomText textAlign="left" baseFont={12} color="#92400E" style={styles.sandboxText}>
                {t("cashfreeSandboxUpiHint")}
              </CustomText>
              <CustomText textAlign="left" baseFont={12} fontWeight="800" color="#047857">
                testsuccess@gocash
              </CustomText>
              <CustomText textAlign="left" baseFont={11} color="#92400E" style={styles.sandboxText}>
                {t("cashfreeSandboxCardHint")}
              </CustomText>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.optionCard, styles.promoteCard]}
            onPress={onPromote}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIconPromote}>
                <Ionicons name="share-social-outline" size={20} color="#047857" />
              </View>
              <View style={styles.optionTextWrap}>
                <CustomHeading textAlign="left" baseFont={15} fontWeight="800">
                  {t("promotionOptionPromoteTitle")}
                </CustomHeading>
                <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
                  {t("promotionOptionPromoteDesc")}
                </CustomText>
              </View>
            </View>
            <View style={styles.pricePill}>
              <CustomText baseFont={13} fontWeight="800" color="#047857">
                ₹{amount}
              </CustomText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, styles.skipCard]}
            onPress={onSubmitWithoutPromotion}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionIconSkip}>
                <Ionicons name="checkmark-done-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.optionTextWrap}>
                <CustomHeading textAlign="left" baseFont={15} fontWeight="800">
                  {t("promotionOptionSkipTitle")}
                </CustomHeading>
                <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
                  {t("promotionOptionSkipDesc")}
                </CustomText>
              </View>
            </View>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.primary} />
              <CustomText baseFont={13} color={Colors.subHeading}>
                {t("promotionProcessing")}
              </CustomText>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(14, 79, 197, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 20,
  },
  benefitBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.15)",
    padding: 12,
    marginBottom: 14,
  },
  benefitText: {
    flex: 1,
    lineHeight: 19,
  },
  sandboxBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  sandboxText: {
    lineHeight: 18,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  promoteCard: {
    borderColor: "#86EFAC",
    backgroundColor: "#F0FDF4",
  },
  skipCard: {
    borderColor: "rgba(14,79,197,0.15)",
    backgroundColor: "#F8FAFF",
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  optionIconPromote: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSkip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(14, 79, 197, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextWrap: {
    flex: 1,
    gap: 4,
  },
  pricePill: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginLeft: 46,
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
});

export default PromotionChoiceModal;
