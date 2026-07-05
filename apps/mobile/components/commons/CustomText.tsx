import APP_CONTEXT from "@/app/context/locale";
import Colors from "@/constants/Colors";
import { getFontSize } from "@/constants/functions";
import React from "react";
import { Text, StyleSheet } from "react-native";

interface CustomTextProps {
  children: any;
  color?: string;
  baseFont?: number;
  fontWeight?: string;
  textAlign?: string;
  margin?: number;
  padding?: number;
  lineHeight?: number;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  style?: any;
  selectable?: boolean;
}

const CustomText = ({
  children,
  color = Colors?.text,
  baseFont = 16,
  fontWeight = "normal",
  textAlign = "center",
  margin = 0,
  padding = 0,
  lineHeight,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
  selectable,
  style,
  ...restProps
}: CustomTextProps) => {
  const { locale } = APP_CONTEXT.useApp();
  return (
    <Text
      style={[
        styles?.text,
        {
          color,
          fontWeight,
          textAlign,
          margin,
          padding,
          // lineHeight: lineHeight || baseFont * 1.2,
        },
        style,
        { fontSize: getFontSize(locale, baseFont) },
      ]}
      numberOfLines={numberOfLines}
      ellipsizeMode="tail"
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      selectable={selectable}
      {...restProps}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    // Global styles can go here if needed
  },
});

export default CustomText;
