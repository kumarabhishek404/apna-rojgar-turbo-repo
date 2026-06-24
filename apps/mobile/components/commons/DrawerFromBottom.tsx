import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import Colors from "@/constants/Colors";
import CustomHeading from "./CustomHeading";
import { Ionicons } from "@expo/vector-icons";
import ButtonComp from "../inputs/Button";

const { height, width } = Dimensions.get("window");

const BottomDrawer = ({
  title,
  visible,
  content,
  onClose,
  primaryButton,
  secondaryButton,
}: any) => {
  const slideAnim = useRef(new Animated.Value(height)).current; // Start off-screen

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: height * 0.2, // Opens from 20% height
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height, // Hide to bottom
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Bottom Drawer */}
      <Animated.View
        style={[
          styles.drawerContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <CustomHeading
            baseFont={18}
            fontWeight="bold"
            textAlign="left"
            style={styles.headerTitle}
          >
            {title}
          </CustomHeading>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content and Buttons */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Dynamic Content */}
          <View style={styles.content}>{content()}</View>

          {/* Footer Buttons (Inside ScrollView) */}
          <View style={styles.footer}>
            {secondaryButton && (
              <ButtonComp
                isPrimary={false}
                title={secondaryButton.title}
                onPress={secondaryButton.action}
                bgColor={Colors.danger}
                borderColor={Colors.danger}
                textColor={Colors.white}
                style={{ width: "35%" }}
              />
            )}
            {primaryButton && (
              <ButtonComp
                isPrimary={true}
                title={primaryButton.title || "cancel"}
                onPress={primaryButton.action}
                disabled={primaryButton.disabled}
                bgColor={Colors.success}
                borderColor={Colors.success}
                textColor={Colors.white}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
};

export default BottomDrawer;

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height * 0.9,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 99,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    flexShrink: 0,
    marginTop: 2,
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
    height: "80%",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    // backgroundColor: Colors.background,
    gap: 10,
  },
});
