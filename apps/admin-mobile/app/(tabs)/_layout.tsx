import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native";
import { colors } from "@/constants/theme";
import { useSession } from "@/lib/session";

const TABS: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }
> = {
  users: { label: "Users", icon: "people-outline", activeIcon: "people" },
  services: { label: "Services", icon: "briefcase-outline", activeIcon: "briefcase" },
  analytics: { label: "Analytics", icon: "stats-chart-outline", activeIcon: "stats-chart" },
  logs: { label: "Logs", icon: "warning-outline", activeIcon: "warning" },
  profile: { label: "Profile", icon: "person-outline", activeIcon: "person" },
};

function AdminTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.shell, { paddingBottom: bottom }]}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={focused ? meta.activeIcon : meta.icon}
                  size={20}
                  color={focused ? colors.primary : colors.tabIdle}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { ready, user } = useSession();
  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="users" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="logs" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  shell: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.08)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 52,
  },
  itemPressed: { opacity: 0.72 },
  iconWrap: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "#E7EEFF",
  },
  label: {
    color: colors.tabIdle,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
});
