import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "@/constants/theme";

export function contentWidth(screenWidth: number) {
  return Math.min(screenWidth, 860);
}

export function Hero({
  title,
  subtitle,
  tone = "blue",
  right,
}: {
  title: string;
  subtitle: string;
  tone?: "blue" | "rose";
  right?: ReactNode;
}) {
  return (
    <View style={[styles.hero, tone === "rose" ? styles.heroRose : styles.heroBlue]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.accordion}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={styles.accordionHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.accordionIcon}>
          <Ionicons name="stats-chart" size={16} color={colors.primary} />
        </View>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.tabIdle} />
      </Pressable>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

export function StatGrid({
  items,
}: {
  items: Array<{
    label: string;
    value: number | string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
  }>;
}) {
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 4 : 2;
  return (
    <View style={styles.statGrid}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          style={[styles.stat, { width: columns === 4 ? "23.5%" : "48.5%" }]}
        >
          <View style={styles.statIcon}>
            <Ionicons name={item.icon || "stats-chart"} size={16} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onFilter,
  filterCount = 0,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onFilter?: () => void;
  filterCount?: number;
}) {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.primary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A0A0A0"
          style={styles.searchInput}
        />
      </View>
      {onFilter ? (
        <Pressable style={styles.filterBtn} onPress={onFilter}>
          <Ionicons name="options" size={20} color="#fff" />
          {filterCount > 0 ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

export type AppliedChip = {
  id: string;
  eyebrow: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onRemove: () => void;
};

export function AppliedChips({
  chips,
  onClear,
}: {
  chips: AppliedChip[];
  onClear?: () => void;
}) {
  if (!chips.length) return null;
  return (
    <View style={styles.chipWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        {chips.map((chip) => (
          <View key={chip.id} style={styles.appliedChip}>
            <View style={styles.chipIcon}>
              <Ionicons name={chip.icon} size={13} color={colors.primary} />
            </View>
            <View style={{ maxWidth: 140 }}>
              <Text style={styles.chipEyebrow}>{chip.eyebrow}</Text>
              <Text style={styles.chipValue} numberOfLines={1}>
                {chip.value}
              </Text>
            </View>
            <Pressable onPress={chip.onRemove} hitSlop={8} style={styles.chipClose}>
              <Ionicons name="close" size={13} color={colors.primary} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {chips.length > 1 && onClear ? (
        <Pressable onPress={onClear}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "phone-pad" | "email-address";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

export function ChoiceRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.choiceRow}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onChange(option.value)}
                style={[styles.choice, active && styles.choiceActive]}
              >
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function PickerField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <View style={{ gap: 6, flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={{ color: selected ? colors.ink : "#94a3b8" }}>
          {selected?.label || placeholder}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {options.map((option) => (
                <Pressable
                  key={option.value || "all"}
                  style={styles.sheetRow}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.sheetRowText}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Banner({ text, tone = "error" }: { text: string; tone?: "error" | "ok" }) {
  return (
    <View style={[styles.banner, tone === "ok" ? styles.bannerOk : styles.bannerError]}>
      <Text style={[styles.bannerText, tone === "ok" ? styles.bannerTextOk : styles.bannerTextError]}>
        {text}
      </Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger" | "ghost";
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        tone === "danger" && styles.buttonDanger,
        tone === "ghost" && styles.buttonGhost,
        disabled && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.buttonText, tone === "ghost" && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingBottom: 28 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Badge({ label, tone }: { label: string; tone: "blue" | "green" | "amber" | "rose" | "slate" }) {
  const palette = {
    blue: { bg: "#eef3ff", fg: colors.primary },
    green: { bg: "#ecfdf5", fg: colors.success },
    amber: { bg: "#fff7ed", fg: "#c2410c" },
    rose: { bg: "#fff1f2", fg: colors.rose },
    slate: { bg: "#f1f5f9", fg: "#475569" },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

export function statusTone(status?: string): "green" | "amber" | "rose" | "slate" | "blue" {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
    case "HIRING":
    case "COMPLETED":
      return "green";
    case "PENDING":
    case "APPLIED":
      return "amber";
    case "SUSPENDED":
    case "DISABLED":
    case "CANCELLED":
    case "REJECTED":
    case "DELETED":
      return "rose";
    default:
      return "slate";
  }
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  heroBlue: { backgroundColor: colors.primary },
  heroRose: { backgroundColor: "#9f1239" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  heroSubtitle: { color: "#dbe4ff", marginTop: 6, lineHeight: 20 },
  pageTitle: { color: colors.primary, fontSize: 26, fontWeight: "800" },
  pageSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  accordion: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    ...shadow,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  accordionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionTitle: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: "800" },
  accordionBody: { paddingHorizontal: 12, paddingBottom: 12 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    backgroundColor: colors.soft,
    borderRadius: 18,
    minHeight: 108,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textAlign: "center" },
  statValue: { color: colors.primary, fontSize: 22, fontWeight: "800" },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.12)",
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 10 },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCount: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterCountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  chipWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  chipScroll: { gap: 8, paddingVertical: 2, alignItems: "center" },
  appliedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.14)",
    ...shadow,
  },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: "rgba(34, 64, 154, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipEyebrow: { color: "rgba(34, 64, 154, 0.58)", fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  chipValue: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  chipClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(34, 64, 154, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: { color: colors.primary, fontWeight: "800", fontSize: 13 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: 15,
  },
  choiceRow: { flexDirection: "row", gap: 8 },
  choice: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.16)",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  choiceTextActive: { color: "#fff" },
  banner: { borderRadius: 14, padding: 12 },
  bannerError: { backgroundColor: "#fef2f2" },
  bannerOk: { backgroundColor: "#ecfdf5" },
  bannerText: { fontSize: 14, lineHeight: 20 },
  bannerTextError: { color: colors.danger },
  bannerTextOk: { color: colors.success },
  empty: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontWeight: "800", color: colors.ink, fontSize: 16 },
  emptyBody: { color: colors.muted, textAlign: "center" },
  loading: { padding: 24, alignItems: "center", gap: 8 },
  muted: { color: colors.muted },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDanger: { backgroundColor: colors.danger },
  buttonGhost: { backgroundColor: "#eef3ff" },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "88%",
    gap: 12,
  },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  close: { color: colors.primary, fontWeight: "800" },
  sheetRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  sheetRowText: { color: colors.ink, fontSize: 16 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "800" },
});
