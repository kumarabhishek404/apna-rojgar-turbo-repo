import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Ionicons } from "@expo/vector-icons";
import { colors, shadow } from "@/constants/theme";

const ExpoClipboard = requireOptionalNativeModule<{
  setStringAsync: (text: string) => Promise<boolean>;
}>("ExpoClipboard");

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function InfoLine({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(copy && value && value !== "—" && value !== "Not added");
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueRow}>
        <Text selectable style={styles.infoValue}>
          {value || "—"}
        </Text>
        {canCopy ? (
          <Pressable
            onPress={async () => {
              if (!ExpoClipboard) return;
              await ExpoClipboard.setStringAsync(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            hitSlop={8}
          >
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function StatTiles({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <View style={styles.tiles}>
      {items.map((item) => (
        <View key={item.label} style={styles.tile}>
          <Text style={styles.tileLabel}>{item.label}</Text>
          <Text style={styles.tileValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function Segment({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable key={option.id} onPress={() => onChange(option.id)} style={[styles.segmentItem, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Composer({
  templates,
  templateId,
  message,
  onTemplate,
  onMessage,
  onSend,
  onBack,
  sending,
}: {
  templates: Array<{ id: string; label: string }>;
  templateId: string;
  message: string;
  onTemplate: (id: string) => void;
  onMessage: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
  sending?: boolean;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Pressable onPress={onBack} style={styles.backLink}>
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
        <Text style={styles.backLinkText}>Back to details</Text>
      </Pressable>
      <Panel title="WhatsApp message">
        <View style={styles.pills}>
          {templates.map((item) => {
            const active = item.id === templateId;
            return (
              <Pressable key={item.id} onPress={() => onTemplate(item.id)} style={[styles.pill, active && styles.pillActive]}>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          multiline
          value={message}
          onChangeText={onMessage}
          style={styles.editor}
          textAlignVertical="top"
        />
        <Pressable onPress={onSend} disabled={sending} style={[styles.send, sending && { opacity: 0.6 }]}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={styles.sendText}>Open WhatsApp</Text>
        </Pressable>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  panelTitle: { fontSize: 15, fontWeight: "800", color: colors.ink },
  info: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  infoLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  infoValueRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 2 },
  infoValue: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: "600" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.soft,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tileLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  tileValue: { color: colors.ink, fontSize: 18, fontWeight: "800", marginTop: 4 },
  segment: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segmentItem: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  segmentTextActive: { color: "#fff" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.soft },
  pillActive: { backgroundColor: "#25D366" },
  pillText: { color: colors.ink, fontWeight: "700", fontSize: 12 },
  pillTextActive: { color: "#fff" },
  editor: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    color: colors.ink,
    backgroundColor: colors.soft,
  },
  send: {
    backgroundColor: "#25D366",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sendText: { color: "#fff", fontWeight: "800" },
  backLink: { flexDirection: "row", alignItems: "center" },
  backLinkText: { color: colors.primary, fontWeight: "700" },
});
