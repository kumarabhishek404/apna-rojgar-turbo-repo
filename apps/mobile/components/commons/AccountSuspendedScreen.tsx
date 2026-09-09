import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Linking,
  BackHandler,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAtomValue } from "jotai";
import Colors from "@/constants/Colors";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import Button from "@/components/inputs/Button";
import Loader from "@/components/commons/Loaders/Loader";
import { t } from "@/utils/translationHelper";
import { SUPPORT_EMAIL } from "@/constants/socialLinks";
import Atoms from "@/app/AtomStore";
import REFRESH_USER from "@/app/hooks/useRefreshUser";
import USE_LOGOUT from "@/app/hooks/useLogout";
import TOAST from "@/app/hooks/toast";
import { USER_STATUS } from "@/utils/userStatus";

const AccountSuspendedScreen = () => {
  const insets = useSafeAreaInsets();
  const userDetails = useAtomValue(Atoms.UserAtom);
  const { refreshUser, isLoading } = REFRESH_USER.useRefreshUser();
  const { logout, isLoading: isLoggingOut } = USE_LOGOUT.useLogout();

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, []);

  const openAdminEmail = async () => {
    const mobile = String(userDetails?.mobile || "").trim();
    const userId = String(userDetails?._id || "").trim();
    const subject = t("accountSuspendedEmailSubject");
    const body = t("accountSuspendedEmailBody", { mobile, userId });
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn("Could not open mail app:", error);
      TOAST.error(`${t("accountSuspendedEmailHint")} ${SUPPORT_EMAIL}`);
    }
  };

  const checkStatus = async () => {
    const freshUser = await refreshUser();
    if (!freshUser) return;
    const nextStatus = String(
      (freshUser as { status?: string }).status || "",
    ).toUpperCase();
    if (nextStatus === USER_STATUS.ACTIVE) {
      TOAST.success(t("accountReactivatedMessage"));
      return;
    }
    TOAST.info(t("accountStillSuspended"));
  };

  return (
    <View style={styles.screen} testID="account-suspended-screen">
      <StatusBar style="light" />
      <Loader loading={isLoading || isLoggingOut} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="block" size={56} color={Colors.white} />
        </View>

        <CustomHeading
          baseFont={24}
          color={Colors.white}
          fontWeight="700"
        >
          {t("accountSuspendedTitle")}
        </CustomHeading>

        <CustomText color={Colors.white} baseFont={16} lineHeight={24}>
          {t("accountSuspendedMessage")}
        </CustomText>

        <View style={styles.emailBox}>
          <CustomText color={Colors.white} baseFont={14}>
            {t("accountSuspendedEmailHint")}
          </CustomText>
          <TouchableOpacity
            onPress={openAdminEmail}
            testID="account-suspended-email"
          >
            <CustomText
              color={Colors.white}
              baseFont={17}
              fontWeight="700"
              selectable
            >
              {SUPPORT_EMAIL}
            </CustomText>
          </TouchableOpacity>
        </View>

        <Button
          isPrimary
          testID="account-suspended-email-button"
          title={t("accountSuspendedEmailAction")}
          onPress={openAdminEmail}
          style={styles.primaryButton}
          textColor={Colors.danger}
          bgColor={Colors.white}
          borderColor={Colors.white}
        />

        <Button
          isPrimary={false}
          testID="account-suspended-check-status"
          title={t("accountSuspendedCheckStatus")}
          onPress={checkStatus}
          style={styles.secondaryButton}
          textColor={Colors.white}
          bgColor="transparent"
          borderColor={Colors.white}
        />

        <TouchableOpacity
          onPress={logout}
          testID="account-suspended-logout"
          style={styles.logoutButton}
        >
          <CustomText color={Colors.white} baseFont={15} fontWeight="600">
            {t("logOut")}
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.error,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emailBox: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 6,
    marginTop: 8,
  },
  primaryButton: {
    width: "100%",
    marginTop: 8,
  },
  secondaryButton: {
    width: "100%",
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});

export default AccountSuspendedScreen;
