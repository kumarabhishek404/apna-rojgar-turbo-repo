import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { normalizePickedImageUriForUpload } from "@/utils/normalizePickedImageUriForUpload";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";
import Colors from "@/constants/Colors";
import ProfilePicture from "./ProfilePicture";
import { Ionicons } from "@expo/vector-icons";

type AvatarProps = {
  isEditable: boolean;
  isLoading?: boolean;
  profileImage: string;
  onUpload?: any;
  style?: any;
  avatarWrapperStyle?: any;
  /** Side-by-side profile header: smaller photo + camera chip on avatar. */
  compact?: boolean;
};

const AvatarComponent = ({
  isEditable,
  isLoading,
  profileImage,
  onUpload,
  style,
  avatarWrapperStyle,
  compact = false,
}: AvatarProps) => {
  const pickImage = async () => {
    let result: any = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  
    if (!result.canceled && result.assets[0]?.uri) {
      try {
        const uri = await normalizePickedImageUriForUpload(result.assets[0].uri);
        await onUpload(uri);
      } catch (err) {
        console.log("Error --", err);
      }
    }
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact, style]}>
      <View
        style={[
          styles.avatarOuter,
          compact && styles.avatarOuterCompact,
          avatarWrapperStyle,
        ]}
      >
        <View
          style={[
            styles.avatarWrapper,
            compact && styles.avatarWrapperCompact,
          ]}
        >
          <ProfilePicture uri={profileImage} style={styles.profilePicture} />

          {isLoading && (
            <View style={styles.overlay}>
              <ActivityIndicator
                size={compact ? "small" : "large"}
                color={Colors?.white}
              />
            </View>
          )}
        </View>

        {isEditable && compact ? (
          <TouchableOpacity
            style={styles.cameraFab}
            onPress={pickImage}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t("uploadNewImage")}
          >
            <Ionicons name="camera" size={15} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {isEditable && !compact ? (
        <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
          <CustomText>{t("uploadNewImage")}</CustomText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  containerCompact: {
    alignItems: "flex-start",
  },
  avatarOuter: {
    position: "relative",
    width: 140,
    height: 140,
  },
  avatarOuterCompact: {
    width: 96,
    height: 96,
    marginRight: 2,
    marginBottom: 2,
  },
  avatarWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 80,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderColor: "#ddd",
  },
  avatarWrapperCompact: {
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: "#0a162e",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cameraFab: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: "#0a162e",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 2,
  },
  loader: {
    position: "absolute",
    top: 48,
    left: 48,
    zIndex: 2,
  },
  profilePicture: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editIcon: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 6,
  },
  iconText: {
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AvatarComponent;
