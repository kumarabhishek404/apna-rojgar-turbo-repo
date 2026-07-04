import React from "react";
import { StyleSheet, StyleProp, ImageStyle } from "react-native";
import OptimizedImage from "./OptimizedImage";
import profileImage from "../../assets/person-placeholder.jpg";

interface ProfilePictureProps {
  uri?: string;
  source?: any;
  style?: StyleProp<ImageStyle>;
}

const ProfilePicture = ({ uri, source, style }: ProfilePictureProps) => {
  return (
    <OptimizedImage
      source={uri ? { uri } : source || profileImage}
      style={[styles.productImage, style]}
      contentFit="cover"
      recyclingKey={uri || undefined}
    />
  );
};

const styles = StyleSheet.create({
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 100,
  },
});

export default ProfilePicture;
