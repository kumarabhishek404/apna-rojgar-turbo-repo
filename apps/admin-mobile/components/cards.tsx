import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "@/constants/theme";
import { emailOf, formatWhen, missingProfileFields, personName, type AdminService, type AdminUser } from "@/lib/types";
import { Badge, statusTone } from "@/components/ui";
import { isListingFeatureActive, roleLabel } from "@/lib/details";
import { label } from "@/lib/labels";

export function UserListCard({ user, onPress }: { user: AdminUser; onPress: () => void }) {
  const missing = missingProfileFields(user);
  const skills = (user.skills || [])
    .map((item) => (typeof item === "string" ? item : item.skill))
    .filter(Boolean)
    .slice(0, 2) as string[];
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        {user.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.letter}>{(user.name || "U").slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name?.trim() || "Unnamed"}
          </Text>
          <View style={styles.metaLine}>
            <Ionicons name="call-outline" size={14} color={colors.primary} />
            <Text style={styles.meta} numberOfLines={1}>
              {user.mobile || "No mobile"}
              {emailOf(user) ? ` · ${emailOf(user)}` : ""}
            </Text>
          </View>
          <View style={styles.metaLine}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={styles.meta} numberOfLines={1}>
              {user.address?.trim() || "Address not added"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.badges}>
        <Badge label={roleLabel(user.role)} tone="blue" />
        <Badge label={label(user.status)} tone={statusTone(user.status)} />
        <Badge label={user.verification || "Pending"} tone={user.verification === "Completed" ? "green" : "amber"} />
        {missing.length ? <Badge label="Incomplete" tone="rose" /> : null}
        {skills.map((skill) => (
          <View key={skill} style={styles.skill}>
            <Ionicons name="briefcase-outline" size={11} color={colors.primary} />
            <Text style={styles.skillText} numberOfLines={1}>
              {label(skill)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.footer}>
        {label(user.registrationSource, "Unknown source")} · Joined {formatWhen(user.createdAt)}
      </Text>
    </Pressable>
  );
}

export function ServiceListCard({ service, onPress }: { service: AdminService; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.accent} />
      <View style={styles.serviceHead}>
        <View style={styles.serviceIcon}>
          <Ionicons name="briefcase" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.jobId}>{service.jobID || "No job ID"}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {label(service.type, "Work")} · {label(service.subType, "General")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </View>
      <View style={styles.badges}>
        <Badge label={label(service.status)} tone={statusTone(service.status)} />
        <Badge label={service.bookingType === "direct" ? "Direct" : "Listing"} tone="blue" />
        {isListingFeatureActive(service) ? <Badge label="Featured" tone="amber" /> : null}
      </View>
      <View style={styles.metaLine}>
        <View style={styles.metaIcon}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
        </View>
        <Text style={styles.meta} numberOfLines={2}>
          {service.address || "No address"}
        </Text>
      </View>
      <View style={styles.metaLine}>
        <View style={styles.metaIcon}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        </View>
        <Text style={styles.meta}>
          {personName(service.employer)} · {formatWhen(service.startDate)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.1)",
    overflow: "hidden",
    ...shadow,
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  top: { flexDirection: "row", gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 16 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { color: colors.primary, fontWeight: "800", fontSize: 20 },
  name: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { color: colors.muted, fontSize: 13, flex: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF4FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillText: { color: colors.primary, fontSize: 11, fontWeight: "700", maxWidth: 110 },
  footer: { color: colors.muted, fontSize: 12 },
  serviceHead: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  jobId: { color: colors.primary, fontSize: 12, fontWeight: "800" },
});
