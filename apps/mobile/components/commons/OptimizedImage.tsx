import React from "react";
import {
  Image,
  Platform,
  type ImageProps,
  type ImageResizeMode,
} from "react-native";

type ContentFit = "cover" | "contain" | "fill" | "none" | "scale-down";

type OptimizedImageProps = Omit<ImageProps, "resizeMode"> & {
  contentFit?: ContentFit;
  /** Accepted for API compatibility; RN Image uses its own disk cache. */
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
  /** Accepted for API compatibility; unused by RN Image. */
  recyclingKey?: string;
};

function toResizeMode(contentFit?: ContentFit): ImageResizeMode {
  switch (contentFit) {
    case "contain":
      return "contain";
    case "fill":
      return "stretch";
    case "none":
    case "scale-down":
      return "center";
    case "cover":
    default:
      return "cover";
  }
}

/**
 * Network-friendly Image wrapper. Uses Android `resizeMethod="resize"` so
 * bitmaps are decoded at view size (lower memory) without a native module
 * rebuild. Swap implementation to expo-image after the next dev-client build
 * if desired.
 */
export default function OptimizedImage({
  contentFit = "cover",
  cachePolicy: _cachePolicy,
  recyclingKey: _recyclingKey,
  ...rest
}: OptimizedImageProps) {
  return (
    <Image
      {...rest}
      resizeMode={toResizeMode(contentFit)}
      resizeMethod={Platform.OS === "android" ? "resize" : "auto"}
    />
  );
}
