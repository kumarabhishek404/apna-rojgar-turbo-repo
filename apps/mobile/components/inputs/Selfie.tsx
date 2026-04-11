import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text,
  Pressable,
  Modal,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CameraType, CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import * as ImageManipulator from "expo-image-manipulator";
import TOAST from "@/app/hooks/toast";
import CustomText from "../commons/CustomText";
import { t } from "@/utils/translationHelper";
import ProfilePicture from "../commons/ProfilePicture";
import ErrorText from "../commons/ErrorText";

interface SelfieScreenProps {
  name: string;
  profilePicture: string;
  setProfilePicture: (uri: string) => void;
  onBlur: () => void;
  errors: Record<string, { message?: string } | undefined>;
}

type PickerStep = "choose" | "camera";

function ChoiceCard({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  disabled,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.choiceCard,
        pressed && styles.choiceCardPressed,
        (disabled || loading) && styles.choiceCardDisabled,
      ]}
    >
      <View style={[styles.choiceIconCircle, { backgroundColor: iconBg }]}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name={icon} size={28} color="#fff" />
        )}
      </View>
      <View style={styles.choiceTextCol}>
        <Text style={styles.choiceTitle}>{title}</Text>
        <Text style={styles.choiceSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={Colors.primary} />
    </Pressable>
  );
}

const SelfieScreen = ({
  name,
  profilePicture,
  setProfilePicture,
  onBlur,
  errors,
}: SelfieScreenProps) => {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);
  const facing: CameraType = "front";
  const [step, setStep] = useState<PickerStep>("choose");

  const pickFromGallery = async () => {
    try {
      setLoading(true);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        TOAST.error(t("galleryPermissionRequired"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setProfilePicture(result.assets[0].uri);
        onBlur();
      }
    } catch (err) {
      console.log("error while picking from gallery ", err);
      TOAST.error(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    try {
      setLoading(true);

      const photo = await cameraRef.current.takePictureAsync();

      const manipulatedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG },
      );

      setProfilePicture(manipulatedPhoto?.uri);
      setStep("choose");
      setHasPermission(null);
      onBlur();
    } catch (err) {
      console.log("error while capturing image ", err);
      setProfilePicture("");
      TOAST.error(t("failedToCaptureImageRetryAgain"));
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeSelfie = () => {
    setProfilePicture("");
    setHasPermission(null);
    setStep("choose");
  };

  const goBackToChoose = () => {
    setHasPermission(null);
    setStep("choose");
  };

  const openCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setHasPermission(false);
      TOAST.error(t("cameraPermissionRequired"));
      return;
    }
    setHasPermission(true);
    setStep("camera");
  };

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.alertCard}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
          <Text style={styles.alertTitle}>{t("noAccessToCamera")}</Text>
          <Text style={styles.alertBody}>{t("profilePhotoCameraDeniedHelp")}</Text>
        </View>
        <ChoiceCard
          icon="images-outline"
          iconBg="#5c6bc0"
          title={t("profilePhotoFromPhoneTitle")}
          subtitle={t("profilePhotoFromPhoneDesc")}
          onPress={pickFromGallery}
          loading={loading}
        />
        <TouchableOpacity style={styles.textLinkBtn} onPress={goBackToChoose}>
          <Ionicons name="arrow-back" size={18} color={Colors.primary} />
          <Text style={styles.textLink}>{t("profilePhotoBackToChoices")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (profilePicture) {
    return (
      <View style={styles.previewWrap}>
        <View style={styles.previewFrame}>
          <ProfilePicture uri={profilePicture} style={styles.previewImage} />
          <View style={styles.previewBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.previewBadgeText}>{t("profilePhotoSelected")}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.retakePill}
          onPress={handleRetakeSelfie}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.retakePillText}>{t("profilePhotoTryDifferent")}</Text>
        </TouchableOpacity>
        <CustomText baseFont={15} style={styles.previewHelp}>
          {t("profilePhotoLooksGood")}
        </CustomText>
        {errors?.[name] && <ErrorText>{errors?.[name]?.message}</ErrorText>}
      </View>
    );
  }

  const cameraModalOpen = step === "camera" && hasPermission === true;

  return (
    <View style={styles.container}>
      {step === "choose" && (
        <>
          <Text style={styles.sectionLabel}>{t("profilePhotoPickOne")}</Text>
          <ChoiceCard
            icon="images-outline"
            iconBg="#5c6bc0"
            title={t("profilePhotoFromPhoneTitle")}
            subtitle={t("profilePhotoFromPhoneDesc")}
            onPress={pickFromGallery}
            loading={loading}
          />
          <ChoiceCard
            icon="camera-outline"
            iconBg={Colors.primary}
            title={t("profilePhotoCameraTitle")}
            subtitle={t("profilePhotoCameraDesc")}
            onPress={openCamera}
          />
        </>
      )}

      <Modal
        visible={cameraModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={goBackToChoose}
      >
        <StatusBar barStyle="light-content" />
        <View style={styles.cameraModalRoot}>
          <CameraView
            ref={cameraRef}
            style={styles.cameraModalFill}
            facing={facing}
            autofocus="on"
            enableTorch={false}
            mirror={false}
            mode="picture"
          />
          {loading && (
            <View style={styles.cameraModalLoading}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          <View
            style={[
              styles.cameraModalTopBar,
              { paddingTop: insets.top + 10, paddingHorizontal: 16 },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.cameraModalCloseBtn}
              onPress={goBackToChoose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cameraModalHint} numberOfLines={2}>
              {t("profilePhotoFaceInFrame")}
            </Text>
          </View>

          <View
            style={[
              styles.cameraModalBottom,
              { paddingBottom: Math.max(insets.bottom, 20) + 12 },
            ]}
          >
            <TouchableOpacity
              style={[styles.shutterOuter, loading && styles.shutterDisabled]}
              onPress={takeSelfie}
              disabled={loading}
              activeOpacity={0.9}
            >
              <View style={styles.shutterRing}>
                <View style={styles.shutterInner}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={32} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.cameraModalCaption}>
              {t("profilePhotoTapShutter")}
            </Text>
          </View>
        </View>
      </Modal>

      {errors?.[name] && step === "choose" && (
        <View style={styles.errorWrap}>
          <ErrorText>{errors?.[name]?.message}</ErrorText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.subHeading,
    marginBottom: 2,
  },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF0FF",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.28)",
    gap: 12,
  },
  choiceCardPressed: {
    backgroundColor: "#DCE6FF",
    borderColor: Colors.primary,
  },
  choiceCardDisabled: {
    opacity: 0.7,
  },
  choiceIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceTextCol: {
    flex: 1,
    minWidth: 0,
  },
  choiceTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
  },
  choiceSubtitle: {
    fontSize: 14,
    color: Colors.subHeading,
    marginTop: 2,
    lineHeight: 20,
  },
  alertCard: {
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(220, 53, 69, 0.08)",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(220, 53, 69, 0.2)",
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text,
    textAlign: "center",
    marginTop: 10,
  },
  alertBody: {
    fontSize: 15,
    color: Colors.subHeading,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  textLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  textLink: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  previewWrap: {
    width: "100%",
    alignItems: "center",
  },
  previewFrame: {
    alignItems: "center",
    width: "100%",
  },
  previewImage: {
    width: 260,
    height: 260,
    borderRadius: 130,
    resizeMode: "cover",
    borderWidth: 4,
    borderColor: Colors.success,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "rgba(76, 175, 80, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewBadgeText: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.success,
  },
  retakePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.tertiery,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 16,
  },
  retakePillText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  previewHelp: {
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 22,
    color: Colors.text,
  },
  cameraModalRoot: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraModalFill: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraModalLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraModalTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingBottom: 12,
  },
  cameraModalCloseBtn: {
    padding: 4,
  },
  cameraModalHint: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    paddingRight: 12,
  },
  cameraModalBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingTop: 20,
  },
  cameraModalCaption: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 28,
    lineHeight: 21,
  },
  shutterOuter: {
    alignItems: "center",
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  shutterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "rgba(34, 64, 154, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  errorWrap: {
    marginTop: 8,
  },
});

export default SelfieScreen;
