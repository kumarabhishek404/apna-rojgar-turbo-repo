import {
  StyleSheet,
  Pressable,
  View,
  BackHandler,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Linking } from "react-native";
import React, { useRef, useEffect, useState } from "react";
import { Tabs, router, usePathname } from "expo-router";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  AntDesign,
  Ionicons,
  FontAwesome,
  FontAwesome5,
} from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import { useAtom } from "jotai";
import Atoms from "../AtomStore";
import NOTIFICATION from "../api/notification";
import ExitConfirmationModal from "@/components/commons/ExitPopup";
import UserProfile from "../screens/bottomTabs/(user)/profile";
import API_CLIENT from "../api";
import { getToken } from "@/utils/authStorage";
import { uploadPendingProfileImage } from "@/utils/backgroundImageUpload";
import REFRESH_USER from "../hooks/useRefreshUser";
import APP_CONTEXT from "../context/locale";

const POLLING_INTERVAL = 30000;
type IconLibrary =
  | "MaterialIcons"
  | "MaterialCommunityIcons"
  | "AntDesign"
  | "Ionicons"
  | "FontAwesome"
  | "FontAwesome5";

export default function Layout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /**
   * Keep the tab bar responsive across devices:
   * - iOS can use the real home-indicator inset
   * - Android should avoid large bottom gaps from gesture/nav insets
   */
  const safeBottomInset =
    Platform.OS === "ios"
      ? Math.max(insets.bottom, 6)
      : Math.min(Math.max(insets.bottom, 0), 6);
  const TAB_BAR_CONTENT = 58;
  const tabBarTopPad = 6;
  const tabBarBottomPad = Math.max(safeBottomInset, 4);
  const tabBarHeight = TAB_BAR_CONTENT + tabBarTopPad + tabBarBottomPad;

  const scale = Math.min(width / 375, 1.12);
  const iconSize = Math.round(Math.max(22, Math.min(25, 23.5 * scale)));
  const textSize = Math.max(10, Math.min(11, Math.round(10.5 * scale)));

  const [, setNotificationCount]: any = useAtom(Atoms.notificationCount);
  const pathname = usePathname();
  const [userDetails, setUserDetails] = useAtom(Atoms.UserAtom);

  const [showExitModal, setShowExitModal] = useState(false);
  const history = useRef<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const { refreshUser } = REFRESH_USER.useRefreshUser();
  const { setRole } = APP_CONTEXT.useApp();

  useEffect(() => {
    // wait one render cycle
    setIsReady(true);
  }, []);

  useEffect(() => {
    setRole(userDetails?.role || "");
  }, [userDetails]);

  useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) console.log("Opened via URL:", initialUrl);
    };

    getUrlAsync();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("Received URL:", url);
      // parse the URL and navigate
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (
      !userDetails ||
      !userDetails?.isAuth ||
      !userDetails?._id ||
      !userDetails?.name ||
      !userDetails?.address ||
      !userDetails?.age ||
      !userDetails?.gender
    ) {
      console.log("Redirecting to login screen -  ", userDetails);
      router.replace("/screens/auth/login");
    }
  }, [userDetails, router, isReady]);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const token = await getToken();
        if (!token || !userDetails?._id || !userDetails?.isAuth) return;
        const data = await NOTIFICATION.fetchUnreadNotificationsCount();
        setNotificationCount(data?.unreadCount || 0);
      } catch (error: any) {
        console.error("Error fetching notifications:", error?.response);
      }
    };

    let intervalId: ReturnType<typeof setInterval>;
    if (userDetails?._id) {
      fetchUnreadNotifications();
      intervalId = setInterval(fetchUnreadNotifications, POLLING_INTERVAL);
    }

    return () => clearInterval(intervalId);
  }, [userDetails?._id, setNotificationCount]); // Added setNotificationCount to dependencies

  useEffect(() => {
    if (!history.current.includes(pathname)) {
      history.current.push(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    const exitPaths = [
      "/",
      "/(tabs)",
      "/(tabs)/first",
      "/(tabs)/second",
      "/(tabs)/third",
      "/(tabs)/fourth",
      "/(tabs)/fifth",
    ];
    const backAction = () => {
      if (exitPaths.includes(pathname)) {
        setShowExitModal(true);
      } else if (router?.canGoBack()) {
        router.back();
      } else {
        setShowExitModal(true); // Consider showing exit modal if router can't go back
      }
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => subscription.remove();
  }, [pathname]);

  useEffect(() => {
    if (userDetails?._id && userDetails?.isAuth) refreshUser();
    uploadPendingProfileImage();
  }, [userDetails?._id]);

  const TabButton = ({
    props,
    path,
    title,
    iconName,
    activeIconName,
    iconLibrary = "MaterialIcons",
    itemStyles,
  }: {
    props: any;
    path: string;
    title: string;
    iconName: string;
    activeIconName?: string;
    iconLibrary?: IconLibrary;
    itemStyles?: any;
  }) => {
    const isSelected = `/(tabs)${pathname}` === path;

    const iconMap = {
      MaterialIcons,
      MaterialCommunityIcons,
      AntDesign,
      Ionicons,
      FontAwesome,
      FontAwesome5,
    };

    const Icon = iconMap[iconLibrary];
    const iconNameLiteral = (isSelected && activeIconName ? activeIconName : iconName) as any;

    const {
      style: tabBarItemStyle,
      children: _tabChildren,
      onPress,
      ...pressableRest
    } = props;

    const rowInnerH = TAB_BAR_CONTENT;

    const labelLineHeight = Math.round(textSize * 1.32);

    return (
      <Pressable
        {...pressableRest}
        accessibilityRole="button"
        onPress={onPress ?? (() => router.push(path as any))}
        android_ripple={{ color: "rgba(34, 64, 154, 0.14)", foreground: true }}
        style={({ pressed }) => [
          tabBarItemStyle,
          styles.tabButton,
          { minHeight: rowInnerH },
          itemStyles,
          pressed && Platform.OS === "ios" && styles.tabPressedIos,
        ]}
      >
        <View style={styles.tabColumn}>
          <View style={[styles.tabPill, isSelected && styles.tabPillActive]}>
            <Icon
              name={iconNameLiteral}
              size={isSelected ? iconSize + 1 : iconSize}
              color={isSelected ? "#FFFFFF" : "#5F7BA8"}
            />
            <CustomText
              color={isSelected ? "#FFFFFF" : "#5F7BA8"}
              fontWeight={isSelected ? "700" : "600"}
              baseFont={textSize}
              textAlign="center"
              numberOfLines={2}
              style={[
                styles.tabLabel,
                {
                  lineHeight: labelLineHeight,
                  maxWidth: "100%",
                },
              ]}
            >
              {t(title)}
            </CustomText>
          </View>
        </View>
      </Pressable>
    );
  };

  const isAdmin = userDetails?.isAdmin;
  const apiRole = String(userDetails?.role ?? "").toUpperCase();

  /** Bottom labels match what each tab shows for non-admin users. */
  const workTabTitleKey = isAdmin
    ? "teams"
    : apiRole === "WORKER"
      ? "tabWork"
      : "tabNavWorkLabour";
  const peopleTabTitleKey = isAdmin
    ? "tabPeople"
    : apiRole === "MEDIATOR"
      ? "tabNavPeopleActiveWork"
      : "tabNavPeopleContractors";

  if (!isReady) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <View style={styles.container}>
        {userDetails &&
        !userDetails?.token &&
        userDetails?.status !== "ACTIVE" ? (
          <UserProfile />
        ) : (
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: [
                styles.tabBar,
                {
                  height: tabBarHeight,
                  paddingBottom: tabBarBottomPad,
                  paddingTop: tabBarTopPad,
                  borderTopWidth: 0,
                  borderBottomWidth: 0,
                },
              ],
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                tabBarButton: (props: any) => (
                  <TabButton
                    props={props}
                    path="/(tabs)/"
                    title={isAdmin ? "services" : "tabHome"}
                    iconName={isAdmin ? "grid-outline" : "home-outline"}
                    activeIconName={isAdmin ? "grid" : "home"}
                    iconLibrary="Ionicons"
                  />
                ),
              }}
            />

            <Tabs.Screen
              name="second"
              options={{
                tabBarButton: (props: any) => (
                  <TabButton
                    props={props}
                    path="/(tabs)/second"
                    title={workTabTitleKey}
                    iconName={isAdmin ? "people-outline" : "briefcase-outline"}
                    activeIconName={isAdmin ? "people" : "briefcase"}
                    iconLibrary="Ionicons"
                  />
                ),
              }}
            />

            <Tabs.Screen
              name="third"
              options={{
                tabBarButton: (props: any) => (
                  <TabButton
                    props={props}
                    path="/(tabs)/third"
                    title={peopleTabTitleKey}
                    iconName={apiRole === "MEDIATOR" ? "rocket-outline" : "people-outline"}
                    activeIconName={apiRole === "MEDIATOR" ? "rocket" : "people"}
                    iconLibrary="Ionicons"
                  />
                ),
              }}
            />

            <Tabs.Screen
              name="fourth"
              options={{
                tabBarButton: (props: any) => (
                  <TabButton
                    props={props}
                    path="/(tabs)/fourth"
                    title="tabActivity"
                    iconName={isAdmin ? "alert-circle-outline" : "stats-chart-outline"}
                    activeIconName={isAdmin ? "alert-circle" : "stats-chart"}
                    iconLibrary="Ionicons"
                  />
                ),
              }}
            />

            <Tabs.Screen
              name="fifth"
              options={{
                tabBarButton: (props: any) => (
                  <TabButton
                    props={props}
                    path="/(tabs)/fifth"
                    title="myProfile"
                    iconName="person-outline"
                    activeIconName="person"
                    iconLibrary="Ionicons"
                  />
                ),
              }}
            />
          </Tabs>
        )}

        <ExitConfirmationModal
          visible={showExitModal}
          onCancel={() => setShowExitModal(false)}
          onConfirm={() => {
            BackHandler.exitApp();
            setShowExitModal(false);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(14, 79, 197, 0.12)",
    elevation: 16,
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  tabButton: {
    flex: 1,
    alignSelf: "stretch",
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  tabPressedIos: {
    opacity: 0.92,
  },
  tabColumn: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  /** Inactive: light surface; active: filled pill (modern app–style tab). */
  tabPill: {
    width: "100%",
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 14,
    gap: 2,
    minHeight: 48,
  },
  tabPillActive: {
    backgroundColor: "#0E4FC5",
    paddingVertical: 7,
    paddingHorizontal: 8,
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tabLabel: {
    marginTop: 0,
    paddingHorizontal: 2,
    width: "100%",
    flexShrink: 1,
  },
});
