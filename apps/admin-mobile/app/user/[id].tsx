import { useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { countOf, isVerifiableRole, mapsUrl, nestedNumber, roleLabel, rupees, skillItems } from "@/lib/details";
import { getUser, patchUser, useRecordsVersion } from "@/lib/records";
import { useSession } from "@/lib/session";
import { label } from "@/lib/labels";
import { emailOf, formatWhen, type AdminUser } from "@/lib/types";
import { defaultUserTemplate, openWhatsapp, USER_TEMPLATES, userMessage } from "@/lib/whatsapp";
import { Badge, Banner, EmptyState, statusTone } from "@/components/ui";
import { Composer, InfoLine, Panel, Segment, StatTiles } from "@/components/record";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "verification", label: "Verification" },
  { id: "account", label: "Account" },
];

const LANGUAGES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  hinglish: "Hinglish",
};

export default function UserScreen() {
  const { ready, user: admin } = useSession();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  useRecordsVersion();
  const user = id ? getUser(id) : null;
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [composer, setComposer] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (ready && !admin) return <Redirect href="/login" />;
  if (!user) {
    return (
      <SafeAreaView style={styles.screen}>
        <BackRow title="User" />
        <EmptyState title="User not open" body="Open this person from the users list." />
      </SafeAreaView>
    );
  }

  const role = String(user.role || "").toUpperCase();
  const status = String(user.status || "").toUpperCase();
  const canVerify = isVerifiableRole(role);
  const canSuspend = role !== "ADMIN" && status === "ACTIVE";
  const canActivate = role !== "ADMIN" && (status === "SUSPENDED" || status === "PENDING");
  const phone = user.mobile ? `+${user.countryCode || "91"} ${user.mobile}` : "Not added";

  const openComposer = (template?: string) => {
    const next = template || defaultUserTemplate(user);
    setComposer(next);
    setDraft(userMessage(next, user.name, user.role));
  };

  const setVerification = async (verification: string) => {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/admin/users/${user._id}/verification`, { method: "PATCH", body: { verification } });
      patchUser(user._id, { verification });
      setNotice(verification === "Completed" ? "User is now verified." : `Verification set to ${verification}.`);
      if (verification === "Completed") openComposer("verified");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update verification");
    } finally {
      setBusy(false);
    }
  };

  const confirmStatus = (next: "ACTIVE" | "SUSPENDED") => {
    Alert.alert(
      next === "SUSPENDED" ? "Suspend this account?" : "Activate this account?",
      next === "SUSPENDED"
        ? `${user.name || "This user"} will be signed out and blocked until you activate them again.`
        : `${user.name || "This user"} will be able to use the app again.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: next === "SUSPENDED" ? "Suspend" : "Activate", style: next === "SUSPENDED" ? "destructive" : "default", onPress: () => changeStatus(next) },
      ],
    );
  };

  const changeStatus = async (next: "ACTIVE" | "SUSPENDED") => {
    setBusy(true);
    setError("");
    try {
      if (next === "SUSPENDED") {
        await apiRequest(`/admin/suspend-user/${user._id}`, { method: "DELETE" });
      } else {
        await apiRequest("/admin/activate-user", { method: "POST", body: { userId: user._id } });
      }
      patchUser(user._id, { status: next });
      setNotice(next === "SUSPENDED" ? "Account suspended." : "Account activated.");
      openComposer(next === "SUSPENDED" ? "suspended" : "reactivated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackRow title="User details" />
        <Header user={user} phone={phone} />
        <View style={styles.actions}>
          <Action icon="logo-whatsapp" label="WhatsApp" color="#25D366" disabled={!user.mobile || busy} onPress={() => openComposer()} />
          <Action
            icon="call"
            label="Call"
            disabled={!user.mobile}
            onPress={() => Linking.openURL(`tel:+${String(user.countryCode || "91").replace(/\D/g, "")}${user.mobile}`)}
          />
          {canSuspend ? <Action icon="ban" label="Suspend" color={colors.danger} disabled={busy} onPress={() => confirmStatus("SUSPENDED")} /> : null}
          {canActivate ? (
            <Action icon="checkmark-circle" label={status === "SUSPENDED" ? "Re-activate" : "Activate"} disabled={busy} onPress={() => confirmStatus("ACTIVE")} />
          ) : null}
        </View>
        {error ? <Banner text={error} /> : null}
        {notice && !composer ? <Banner text={notice} tone="ok" /> : null}
        {composer ? (
          <Composer
            templates={[...USER_TEMPLATES]}
            templateId={composer}
            message={draft}
            sending={busy}
            onTemplate={(template) => {
              setComposer(template);
              setDraft(userMessage(template, user.name, user.role));
            }}
            onMessage={setDraft}
            onBack={() => setComposer(null)}
            onSend={async () => {
              const opened = await openWhatsapp(user.countryCode, user.mobile, draft);
              if (!opened) setError("This user has no usable mobile number.");
            }}
          />
        ) : (
          <>
            <Segment options={TABS} value={tab} onChange={setTab} />
            {tab === "overview" ? <Overview user={user} phone={phone} onWelcome={() => openComposer("welcome")} /> : null}
            {tab === "activity" ? <Activity user={user} role={role} /> : null}
            {tab === "verification" ? (
              <Verification user={user} canVerify={canVerify} busy={busy} onChange={setVerification} />
            ) : null}
            {tab === "account" ? <Account user={user} role={role} status={status} /> : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview({ user, phone, onWelcome }: { user: AdminUser; phone: string; onWelcome: () => void }) {
  const role = String(user.role || "").toUpperCase();
  const skills = skillItems(user.skills);
  const point = mapsUrl(user.geoLocation);
  const language = LANGUAGES[String(user.locale?.language || "").toLowerCase()] || user.locale?.language || "Not added";
  const stats = roleStats(user, role);
  const ratingCount = Number(user.rating?.count || 0);
  return (
    <View style={{ gap: 12 }}>
      <StatTiles
        items={[
          ...stats,
          { label: "Rating", value: ratingCount ? Number(user.rating?.average || 0).toFixed(1) : "—" },
          { label: role === "EMPLOYER" ? "Spent on work" : "Earned from work", value: rupees(role === "EMPLOYER" ? user.spent?.work : user.earnings?.work) },
        ]}
      />
      <Panel title="Contact">
        <InfoLine label="Mobile" value={phone} copy />
        <InfoLine label="Email" value={emailOf(user) || "Not added"} copy />
        <InfoLine label="Email verification" value={typeof user.email === "object" && user.email?.isVerified ? "Verified" : "Not verified"} />
        <InfoLine label="Notifications" value={user.notificationConsent === false ? "Turned off" : "Turned on"} />
      </Panel>
      <Panel title="Personal details">
        <InfoLine label="Gender" value={user.gender || "Not added"} />
        <InfoLine label="Age" value={user.age || "Not added"} />
        <InfoLine label="Date of birth" value={user.dateOfBirth || "Not added"} />
        <InfoLine label="Language" value={language} />
        <InfoLine label="Aadhaar" value={user.aadhaarNumber || "Not added"} copy />
      </Panel>
      <Panel title="Skills">
        {skills.length ? (
          <View style={styles.pills}>
            {skills.map((skill) => (
              <Text key={`${skill.name}-${skill.pay}`} style={styles.pill}>
                {label(skill.name)}
                {skill.pay ? `  ${skill.pay}` : ""}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No skills added yet.</Text>
        )}
      </Panel>
      <Panel title="Address & location">
        <Text style={styles.body}>{user.address || "No address added"}</Text>
        <View style={styles.inline}>
          {point ? (
            <Pressable onPress={() => Linking.openURL(point)} style={styles.linkBtn}>
              <Ionicons name="map-outline" size={16} color={colors.primary} />
              <Text style={styles.linkText}>Open in Maps</Text>
            </Pressable>
          ) : (
            <Text style={styles.muted}>Location pin not shared</Text>
          )}
        </View>
        {user.address ? <InfoLine label="Address" value={user.address} copy /> : null}
      </Panel>
      <Panel title="Welcome message">
        <Text style={styles.muted}>Send the role-based welcome message and community group link.</Text>
        <Pressable onPress={onWelcome} disabled={!user.mobile} style={[styles.welcome, !user.mobile && { opacity: 0.5 }]}>
          <Ionicons name="logo-whatsapp" color="#fff" size={16} />
          <Text style={styles.welcomeText}>Preview and send welcome</Text>
        </Pressable>
      </Panel>
      <Panel title="Rating">
        <Text style={styles.body}>
          {ratingCount ? `${Number(user.rating?.average || 0).toFixed(1)} / 5 · ${ratingCount} review${ratingCount === 1 ? "" : "s"}` : "No reviews yet"}
        </Text>
      </Panel>
    </View>
  );
}

function Activity({ user, role }: { user: AdminUser; role: string }) {
  const skills = skillItems(user.skills);
  return (
    <View style={{ gap: 12 }}>
      <Panel title="Work activity">
        <StatTiles items={roleStats(user, role)} />
      </Panel>
      <Panel title="Engagement">
        <StatTiles
          items={[
            { label: "Skills added", value: String(skills.length) },
            { label: "Saved jobs", value: String(countOf(user.likedServices)) },
            { label: "People liked", value: String(countOf(user.likedUsers)) },
            { label: "Liked by others", value: String(countOf(user.likedBy)) },
            { label: "Jobs booked", value: String(countOf(user.myBookings)) },
            { label: "Times booked", value: String(countOf(user.bookedBy)) },
            { label: "Booking requests", value: String(countOf(user.bookingRequestBy)) },
            { label: "Saved addresses", value: String(countOf(user.savedAddresses)) },
          ]}
        />
      </Panel>
      <Panel title="Earnings">
        <InfoLine label="From work" value={rupees(user.earnings?.work)} />
        <InfoLine label="Rewards" value={rupees(user.earnings?.rewards)} />
      </Panel>
      <Panel title="Spent">
        <InfoLine label="On work" value={rupees(user.spent?.work)} />
        <InfoLine label="Tips" value={rupees(user.spent?.tip)} />
      </Panel>
    </View>
  );
}

function Verification({
  user,
  canVerify,
  busy,
  onChange,
}: {
  user: AdminUser;
  canVerify: boolean;
  busy: boolean;
  onChange: (value: string) => void;
}) {
  const current = user.verification === "Applied" || user.verification === "Completed" ? user.verification : "Pending";
  const options = [
    { value: "Pending", hint: "Not reviewed yet" },
    { value: "Applied", hint: "Request received" },
    { value: "Completed", hint: "Show verified mark" },
  ];
  return (
    <Panel title="Verification">
      <Badge label={current} tone={current === "Completed" ? "green" : "amber"} />
      <Text style={styles.muted}>
        {canVerify
          ? "Mark worker, employer, or contractor profiles as verified after review."
          : "Admin accounts cannot be marked as verified users."}
      </Text>
      {canVerify
        ? options.map((option) => {
            const active = current === option.value;
            return (
              <Pressable
                key={option.value}
                disabled={busy || active}
                onPress={() => onChange(option.value)}
                style={[styles.verify, active && styles.verifyActive]}
              >
                <Text style={[styles.verifyTitle, active && { color: "#fff" }]}>{option.value}</Text>
                <Text style={[styles.muted, active && { color: "#dbe4ff" }]}>{option.hint}</Text>
              </Pressable>
            );
          })
        : null}
    </Panel>
  );
}

function Account({ user, role, status }: { user: AdminUser; role: string; status: string }) {
  const source = String(user.registrationSource || "").toLowerCase();
  const sourceLabel = source === "android" ? "Android" : source === "ios" ? "iOS" : source === "web" ? "Website" : user.registrationSource || "Unknown";
  return (
    <Panel title="Account record">
      <InfoLine label="User ID" value={user._id} copy />
      <InfoLine label="Role" value={roleLabel(role)} />
      <InfoLine label="Joined" value={formatWhen(user.createdAt)} />
      <InfoLine label="Last updated" value={formatWhen(user.updatedAt)} />
      <InfoLine label="Joined via" value={sourceLabel} />
      <InfoLine label="Account safety" value={status === "ACTIVE" ? "Can use the app" : `Currently ${label(status)}`} />
    </Panel>
  );
}

function roleStats(user: AdminUser, role: string) {
  if (role === "EMPLOYER") {
    return [
      { label: "Jobs posted", value: String(nestedNumber(user.serviceDetails, ["byService", "total"])) },
      { label: "Jobs completed", value: String(nestedNumber(user.serviceDetails, ["byService", "completed"])) },
      { label: "Jobs pending", value: String(nestedNumber(user.serviceDetails, ["byService", "pending"])) },
      { label: "Direct requests sent", value: String(nestedNumber(user.serviceDetails, ["directBooking", "sentRequests"])) },
    ];
  }
  if (role === "MEDIATOR") {
    return [
      { label: "Team size", value: String(Number(user.numberOfWorkersInTeam || 0)) },
      { label: "Applied for jobs", value: String(nestedNumber(user.mediatorDetails, ["applied"])) },
      { label: "Selected", value: String(nestedNumber(user.mediatorDetails, ["selected"])) },
      { label: "Completed", value: String(nestedNumber(user.mediatorDetails, ["completed"])) },
    ];
  }
  return [
    { label: "Applications sent", value: String(nestedNumber(user.workDetails, ["byService", "appliedIndividually", "applied"])) },
    { label: "Selected for work", value: String(nestedNumber(user.workDetails, ["byService", "appliedIndividually", "selected"])) },
    { label: "Work completed", value: String(nestedNumber(user.workDetails, ["byService", "appliedIndividually", "completed"])) },
    { label: "Direct requests received", value: String(nestedNumber(user.workDetails, ["directBooking", "recievedRequests"])) },
  ];
}

function Header({ user, phone }: { user: AdminUser; phone: string }) {
  const letter = (user.name || user.mobile || "?").trim().charAt(0).toUpperCase();
  return (
    <View style={styles.header}>
      {user.profilePicture ? (
        <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.letter}>{letter}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.name}>{user.name?.trim() || "Unnamed user"}</Text>
        <Text style={styles.phone}>{phone}</Text>
        <View style={styles.badges}>
          <Badge label={roleLabel(user.role)} tone="blue" />
          <Badge label={label(user.status)} tone={statusTone(user.status)} />
          <Badge label={user.verification || "Pending"} tone={user.verification === "Completed" ? "green" : "amber"} />
        </View>
      </View>
    </View>
  );
}

function BackRow({ title }: { title: string }) {
  return (
    <View style={styles.backRow}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.screenTitle}>{title}</Text>
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
  disabled,
  color = colors.primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.action, { backgroundColor: color }, disabled && { opacity: 0.45 }]}>
      <Ionicons name={icon} size={16} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  screenTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  header: { flexDirection: "row", gap: 12, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  letter: { color: "#fff", fontSize: 24, fontWeight: "800" },
  name: { fontSize: 20, fontWeight: "800", color: colors.ink },
  phone: { color: colors.muted },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { backgroundColor: colors.soft, color: colors.ink, borderRadius: 999, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 7, fontWeight: "700" },
  muted: { color: colors.muted, fontSize: 13 },
  body: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  inline: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  linkText: { color: colors.primary, fontWeight: "700" },
  welcome: { marginTop: 8, backgroundColor: "#25D366", borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  welcomeText: { color: "#fff", fontWeight: "800" },
  verify: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, gap: 2 },
  verifyActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  verifyTitle: { fontWeight: "800", color: colors.ink },
});
