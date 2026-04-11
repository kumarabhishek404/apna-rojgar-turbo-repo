import React from "react";
import { View, StyleSheet, Platform, ScrollView, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import Button from "@/components/inputs/Button";
import { Controller, useForm } from "react-hook-form";
import SelfieScreen from "@/components/inputs/Selfie";
import TOAST from "@/app/hooks/toast";
import { t } from "@/utils/translationHelper";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import USER from "@/app/api/user";
import { saveToken } from "@/utils/authStorage";
import { useSetAtom } from "jotai";
import Atoms from "@/app/AtomStore";
import {
  savePendingProfileUpload,
  uploadPendingProfileImage,
} from "@/utils/backgroundImageUpload";
import PUSH_NOTIFICATION from "@/app/hooks/usePushNotification";

const UploadProfilePictureScreen = () => {
  const insets = useSafeAreaInsets();
  const { userId: userIdParam, role, skills } = useLocalSearchParams();
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
  const setUserDetails = useSetAtom(Atoms.UserAtom);
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      profilePicture: "",
    },
  });

  const mutationFinishRegistration = useMutation({
    mutationKey: ["finishRegistration"],
    mutationFn: (payload: any) => USER.updateUserById(payload),
    onSuccess: async (response: any) => {
      const token = response?.data?.token;
      const user = response?.data?.data;
      await saveToken(token);
      setUserDetails({ isAuth: true, ...user });

      router.replace("/(tabs)");

      void uploadPendingProfileImage();

      if (user?._id) {
        void PUSH_NOTIFICATION.registerForPushNotificationsAsync(
          true,
          user._id,
        ).catch((err) =>
          console.error("Push notification registration failed: ", err),
        );
      }
    },
    onError: (error) => {
      console.error("Error finishing registration: ", error);
    },
  });

  const handleProfilePictureSubmit = async (data: any) => {
    try {
      const parsedSkills = skills ? JSON.parse(skills as string) : [];

      if (!userId) {
        TOAST?.error(t("somethingWentWrong"));
        return;
      }

      if (data?.profilePicture) {
        const uri =
          Platform.OS === "android"
            ? data.profilePicture
            : data.profilePicture.replace("file://", "");

        await savePendingProfileUpload({
          uri,
          userId: String(userId),
        });
      }

      mutationFinishRegistration.mutate({
        _id: userId,
        role,
        skills: parsedSkills,
      });
    } catch (error) {
      console.error("Error submitting profile picture:", error);
      TOAST?.error(t("somethingWentWrong"));
    }
  };

  const hasPhoto = Boolean(watch("profilePicture"));
  const footerPad = Math.max(insets.bottom, 16);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.primary, "#3558b8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="person" size={28} color={Colors.primary} />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {t("addProfilePhotoTitle")}
            </Text>
            <View style={styles.optionalPill}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.optionalPillText}>
                {t("profilePhotoOptionalBadge")}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {!hasPhoto && (
            <View style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={22} color={Colors.action} />
              <Text style={styles.tipText}>{t("selfieHelpsWork")}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="profilePicture"
            defaultValue=""
            rules={{}}
            render={({ field: { onChange, onBlur, value } }) => (
              <SelfieScreen
                name="profilePicture"
                profilePicture={value}
                setProfilePicture={onChange}
                onBlur={onBlur}
                errors={errors}
              />
            )}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          {
            paddingBottom: footerPad,
            paddingTop: 12,
          },
        ]}
      >
        <Button
          isPrimary={true}
          title={t("back")}
          onPress={() => router.back()}
          bgColor={Colors.danger}
          borderColor={Colors.danger}
          style={styles.footerBackBtn}
        />
        <Button
          isPrimary={true}
          title={hasPhoto ? t("saveAndNext") : t("skipAndContinue")}
          onPress={handleSubmit(handleProfilePictureSubmit)}
          bgColor={hasPhoto ? Colors.success : Colors.primary}
          borderColor={hasPhoto ? Colors.success : Colors.primary}
          style={styles.footerContinueBtn}
          loading={mutationFinishRegistration.isPending}
          disabled={mutationFinishRegistration.isPending}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.secondaryBackground,
  },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  heroTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 6,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "left",
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  optionalPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexWrap: "wrap",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    maxWidth: "100%",
  },
  optionalPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF6ED",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.35)",
    marginBottom: 14,
  },
  tipText: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#22409a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.08)",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.secondaryBackground,
  },
  footerBackBtn: {
    width: "32%",
    paddingHorizontal: 6,
    minHeight: 48,
  },
  footerContinueBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 8,
  },
});

export default UploadProfilePictureScreen;
