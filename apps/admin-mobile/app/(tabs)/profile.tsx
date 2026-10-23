import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { colors } from "@/constants/theme";
import { apiRequest, setMemoryToken } from "@/lib/api";
import { useSession } from "@/lib/session";
import { emailOf } from "@/lib/types";
import { Banner, ChoiceRow, Field, PrimaryButton, Sheet } from "@/components/ui";

type TabKey = "overview" | "settings";

export default function ProfileScreen() {
  const { user, refreshProfile, signOut } = useSession();
  const [tab, setTab] = useState<TabKey>("overview");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState(user?.address || "");
  const [email, setEmail] = useState(emailOf(user || undefined));
  const [gender, setGender] = useState(user?.gender || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await apiRequest<{ token?: string }>("/user/info", {
        method: "PATCH",
        body: { name: name.trim(), address: address.trim(), email: email.trim(), gender },
      });
      if (response.token) {
        setMemoryToken(response.token);
        await SecureStore.setItemAsync("admin_apna_rojgar_token", response.token);
      }
      await refreshProfile();
      setMessage("Profile saved.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.switcher}>
        {(
          [
            { key: "overview", label: "Overview", icon: "person-outline" },
            { key: "settings", label: "Settings", icon: "settings-outline" },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <Pressable key={item.key} style={styles.switchItem} onPress={() => setTab(item.key)}>
              <Ionicons name={item.icon} size={18} color={active ? "#fff" : "rgba(255,255,255,0.55)"} />
              <Text style={[styles.switchLabel, active && styles.switchLabelActive]}>{item.label}</Text>
              {active ? <View style={styles.indicator} /> : null}
            </Pressable>
          );
        })}
      </View>

      {tab === "overview" ? (
        <ScrollView contentContainerStyle={styles.sheet}>
          <View style={styles.hero}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <Image source={require("../../assets/logo.png")} style={styles.avatar} />
            )}
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.name}>{user?.name?.trim() || "Admin"}</Text>
              <Text style={styles.caption}>Current role</Text>
              <View style={styles.roleRow}>
                <View style={styles.roleIcon}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                </View>
                <Text style={styles.roleText}>{user?.role || "ADMIN"}</Text>
              </View>
              <Text style={styles.heroMeta}>{user?.mobile || "No mobile"}</Text>
              <Text style={styles.heroMeta}>{user?.status || "ACTIVE"}</Text>
            </View>
          </View>
          <View style={styles.panel}>
            <Info label="Email" value={emailOf(user || undefined) || "Not added"} />
            <Info label="Address" value={user?.address || "Not added"} />
            <Info label="Gender" value={user?.gender || "Not added"} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.sheet}>
          <View style={styles.panel}>
            <MenuRow icon="create-outline" title="Edit profile" onPress={() => setEditing(true)} />
            <MenuRow icon="call-outline" title={user?.mobile || "Mobile"} hint="Cannot be changed here" />
            <MenuRow icon="log-out-outline" title="Sign out" danger onPress={() => void signOut()} />
          </View>
          <Text style={styles.copy}>Admin - Apna Rojgar</Text>
        </ScrollView>
      )}

      <Sheet visible={editing} title="Edit profile" onClose={() => setEditing(false)}>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="name@email.com" />
        <Field label="Address" value={address} onChangeText={setAddress} />
        <ChoiceRow
          label="Gender"
          value={gender}
          onChange={setGender}
          options={[
            { value: "", label: "Skip" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
          ]}
        />
        {error ? <Banner text={error} /> : null}
        {message ? <Banner text={message} tone="ok" /> : null}
        <PrimaryButton label={busy ? "Saving…" : "Save profile"} onPress={save} disabled={busy} />
      </Sheet>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  hint,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.menu} onPress={onPress} disabled={!onPress}>
      <View style={[styles.menuIcon, danger && { backgroundColor: "#FEF2F2" }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: colors.danger }]}>{title}</Text>
        {hint ? <Text style={styles.menuHint}>{hint}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color="#94a3b8" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  switcher: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 8 },
  switchItem: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 10 },
  switchLabel: { color: "rgba(255,255,255,0.55)", fontWeight: "600", fontSize: 13 },
  switchLabelActive: { color: "#fff", fontWeight: "800" },
  indicator: { width: 28, height: 3, borderRadius: 2, backgroundColor: "#fff" },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    gap: 14,
    minHeight: "100%",
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    marginTop: -4,
  },
  avatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#fff" },
  name: { color: "#fff", fontSize: 22, fontWeight: "800" },
  caption: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: "700" },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  roleText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  heroMeta: { color: "rgba(255,255,255,0.86)", fontSize: 13 },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  info: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 2 },
  infoLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  infoValue: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  menuHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  copy: { textAlign: "center", color: colors.muted, marginTop: 8 },
});
