import { useEffect, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { applicantsOf, isListingFeatureActive, mapsUrl, payRange, personOf, roleLabel, workersNeeded } from "@/lib/details";
import { getService, patchService, useRecordsVersion } from "@/lib/records";
import { useSession } from "@/lib/session";
import { emailOf, formatWhen, personName, type AdminService } from "@/lib/types";
import { label, labelList } from "@/lib/labels";
import { defaultEmployerTemplate, EMPLOYER_TEMPLATES, employerMessage, openWhatsapp } from "@/lib/whatsapp";
import { Badge, Banner, EmptyState, Field, statusTone } from "@/components/ui";
import { Composer, InfoLine, Panel, Segment, StatTiles } from "@/components/record";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "applicants", label: "Applicants" },
  { id: "promotion", label: "Promotion" },
  { id: "technical", label: "Technical" },
];

const DAY_PRESETS = [3, 7, 15, 30];

export default function ServiceScreen() {
  const { ready, user } = useSession();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  useRecordsVersion();
  const service = id ? getService(id) : null;
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [composer, setComposer] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (ready && !user) return <Redirect href="/login" />;
  if (!service) {
    return (
      <SafeAreaView style={styles.screen}>
        <BackRow title="Service" />
        <EmptyState title="Service not open" body="Open this work from the services list." />
      </SafeAreaView>
    );
  }

  const status = String(service.status || "").toUpperCase();
  const employer = personOf(service.employer);
  const worker = personOf(service.bookedWorker);
  const applicants = applicantsOf(service);
  const title = [service.type, service.subType].filter(Boolean).map((part) => label(part)).join(" · ") || "Work";
  const canCancel = status === "HIRING" || status === "PENDING";
  const canReactivate = status === "CANCELLED" && service.bookingType !== "direct";
  const featured = isListingFeatureActive(service);

  const messageFor = (template: string) =>
    employerMessage(template, {
      name: employer?.name,
      title,
      jobId: service.jobID,
      applicants: applicants.length,
    });

  const openComposer = (template?: string) => {
    const next = template || defaultEmployerTemplate(service.status, applicants.length);
    setComposer(next);
    setDraft(messageFor(next));
  };

  const confirmStatus = (next: "CANCELLED" | "HIRING") => {
    Alert.alert(
      next === "CANCELLED" ? "Cancel this work?" : "Re-activate this work?",
      next === "CANCELLED"
        ? `${title} (${service.jobID || "—"}) will be hidden from workers.`
        : `${title} (${service.jobID || "—"}) will go back to Hiring.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: next === "CANCELLED" ? "Cancel work" : "Re-activate",
          style: next === "CANCELLED" ? "destructive" : "default",
          onPress: () => changeStatus(next),
        },
      ],
    );
  };

  const changeStatus = async (next: "CANCELLED" | "HIRING") => {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/admin/services/${service._id}/status`, { method: "PATCH", body: { status: next } });
      patchService(service._id, { status: next });
      setNotice(next === "CANCELLED" ? "Work cancelled." : "Work is hiring again.");
      if (employer?.mobile) openComposer(next === "CANCELLED" ? "cancelled" : "reactivated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the service");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackRow title="Service details" />
        <View style={styles.header}>
          <Text style={styles.job}>{service.jobID || "No job ID"}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{service.address || "No address"}</Text>
          <View style={styles.badges}>
            <Badge label={label(service.status)} tone={statusTone(service.status)} />
            <Badge label={service.bookingType === "direct" ? "Direct" : "Open listing"} tone="blue" />
            {featured ? <Badge label="Featured" tone="amber" /> : null}
          </View>
        </View>
        <View style={styles.actions}>
          <Action icon="logo-whatsapp" label="WhatsApp employer" color="#25D366" disabled={!employer?.mobile || busy} onPress={() => openComposer()} />
          {employer?.mobile ? (
            <Action
              icon="call"
              label="Call employer"
              onPress={() => Linking.openURL(`tel:+${String(employer.countryCode || "91").replace(/\D/g, "")}${employer.mobile}`)}
            />
          ) : null}
          {canCancel ? <Action icon="close-circle" label="Cancel" color={colors.danger} disabled={busy} onPress={() => confirmStatus("CANCELLED")} /> : null}
          {canReactivate ? <Action icon="refresh" label="Re-activate" disabled={busy} onPress={() => confirmStatus("HIRING")} /> : null}
        </View>
        {status === "CANCELLED" && service.bookingType === "direct" ? (
          <Banner text="Direct bookings cannot be re-activated from here." />
        ) : null}
        {error ? <Banner text={error} /> : null}
        {notice && !composer ? <Banner text={notice} tone="ok" /> : null}
        {composer ? (
          <Composer
            templates={[...EMPLOYER_TEMPLATES]}
            templateId={composer}
            message={draft}
            onTemplate={(template) => {
              setComposer(template);
              setDraft(messageFor(template));
            }}
            onMessage={setDraft}
            onBack={() => setComposer(null)}
            onSend={async () => {
              const opened = await openWhatsapp(employer?.countryCode, employer?.mobile, draft);
              if (!opened) setError("The employer has no usable mobile number.");
            }}
          />
        ) : (
          <>
            <Segment options={TABS} value={tab} onChange={setTab} />
            {tab === "overview" ? <Overview service={service} onWhatsapp={() => openComposer()} /> : null}
            {tab === "applicants" ? <Applicants service={service} /> : null}
            {tab === "promotion" ? <Promotion service={service} onUpdated={(listingFeature) => patchService(service._id, { listingFeature })} /> : null}
            {tab === "technical" ? <Technical service={service} /> : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview({ service, onWhatsapp }: { service: AdminService; onWhatsapp: () => void }) {
  const employer = personOf(service.employer);
  const worker = personOf(service.bookedWorker);
  const map = mapsUrl(service.geoLocation);
  const facilities = service.facilities || {};
  const facilityLabels = [
    facilities.food ? "Food" : null,
    facilities.living ? "Stay" : null,
    facilities.travelling ? "Travel" : null,
    facilities.esi_pf ? "ESI / PF" : null,
  ].filter(Boolean);
  return (
    <View style={{ gap: 12 }}>
      <StatTiles
        items={[
          { label: "Applicants", value: String(service.appliedUsers?.length ?? 0) },
          { label: "Selected", value: String(service.selectedUsers?.length ?? 0) },
          { label: "Workers needed", value: workersNeeded(service) ? String(workersNeeded(service)) : "—" },
          { label: "Pay / day", value: payRange(service) },
          { label: "Liked by", value: String(service.likedBy?.length ?? 0) },
          { label: "Images", value: String(service.images?.length ?? 0) },
        ]}
      />
      {service.images?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {service.images.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} />
          ))}
        </ScrollView>
      ) : null}
      <Panel title="Work information">
        <InfoLine label="Work type" value={label(service.type)} />
        <InfoLine label="Subtype" value={label(service.subType)} />
        <InfoLine label="Booking type" value={service.bookingType === "direct" ? "Direct booking" : "Open listing"} />
        <InfoLine label="Duration (days)" value={service.duration ? String(service.duration) : "—"} />
        <InfoLine label="Starts" value={formatWhen(service.startDate)} />
        {service.description ? <Text style={styles.body}>{service.description}</Text> : null}
      </Panel>
      <Panel title="Requirements">
        {(service.requirements || []).length ? (
          service.requirements?.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.req}>
              <Text style={styles.body}>{label(item.name, "Worker")}</Text>
              <Text style={styles.meta}>
                {item.count || 0} people · {item.payPerDay ? `₹${item.payPerDay}/day` : "Pay not set"}
                {item.food ? " · Food" : ""}
                {item.living ? " · Stay" : ""}
                {item.pf ? " · PF" : ""}
                {item.insurance ? " · Insurance" : ""}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.meta}>No requirements added.</Text>
        )}
        <InfoLine label="Facilities" value={facilityLabels.length ? facilityLabels.join(", ") : "None listed"} />
      </Panel>
      <Panel title="Employer">
        {employer ? (
          <>
            <Text style={styles.body}>{employer.name || "Unknown user"}</Text>
            <View style={styles.badges}>
              <Badge label={roleLabel(employer.role)} tone="blue" />
              <Badge label={label(employer.status)} tone={statusTone(employer.status)} />
            </View>
            <View style={styles.actions}>
              <Action icon="logo-whatsapp" label="WhatsApp" color="#25D366" disabled={!employer.mobile} onPress={onWhatsapp} />
              {employer.mobile ? (
                <Action
                  icon="call"
                  label="Call"
                  onPress={() => Linking.openURL(`tel:+${String(employer.countryCode || "91").replace(/\D/g, "")}${employer.mobile}`)}
                />
              ) : null}
            </View>
            <InfoLine label="Mobile" value={employer.mobile || "—"} copy />
            <InfoLine label="Email" value={emailOf(employer) || "—"} copy />
            <InfoLine label="Source" value={label(employer.registrationSource)} />
            <InfoLine label="Address" value={employer.address || "—"} copy />
          </>
        ) : (
          <Text style={styles.meta}>
            {typeof service.employer === "string" ? `Employer ID: ${service.employer}` : "Employer details were not included."}
          </Text>
        )}
      </Panel>
      {worker ? (
        <Panel title="Booked worker">
          <InfoLine label="Name" value={worker.name || personName(service.bookedWorker)} />
          <InfoLine label="Mobile" value={worker.mobile || "—"} copy />
          <InfoLine label="Role" value={roleLabel(worker.role)} />
          <InfoLine label="Address" value={worker.address || "—"} copy />
        </Panel>
      ) : null}
      <Panel title="Work location">
        <Text style={styles.body}>{service.address || "No address"}</Text>
        {service.address ? <InfoLine label="Address" value={service.address} copy /> : null}
        {map ? (
          <Pressable onPress={() => Linking.openURL(map)} style={styles.linkBtn}>
            <Ionicons name="map-outline" size={16} color={colors.primary} />
            <Text style={styles.linkText}>Open in Maps</Text>
          </Pressable>
        ) : (
          <Text style={styles.meta}>Location pin not shared</Text>
        )}
      </Panel>
    </View>
  );
}

function Applicants({ service }: { service: AdminService }) {
  const rows = applicantsOf(service);
  if (!rows.length) return <EmptyState title="No applicants" body="No workers or contractors have applied yet." />;
  return (
    <View style={{ gap: 10 }}>
      {rows.map((row) => (
        <View key={row.key} style={styles.card}>
          <View style={styles.person}>
            {row.profilePicture ? (
              <Image source={{ uri: row.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.letter}>{(row.name || "?").charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.body}>{row.name}</Text>
              <View style={styles.badges}>
                <Badge label={roleLabel(row.role)} tone="blue" />
                <Badge label={label(row.status)} tone={statusTone(row.status)} />
              </View>
              {row.viaMediator ? <Text style={styles.meta}>via {row.viaMediator}</Text> : null}
            </View>
          </View>
          <InfoLine label="Skill" value={labelList(row.skill)} />
          <InfoLine label="Mobile" value={row.mobile} copy />
          <InfoLine label="Address" value={row.address} copy />
          {row.mobile && row.mobile !== "—" ? (
            <Action icon="call" label="Call" onPress={() => Linking.openURL(`tel:+91${row.mobile.replace(/\D/g, "").slice(-10)}`)} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function Promotion({
  service,
  onUpdated,
}: {
  service: AdminService;
  onUpdated: (listingFeature: AdminService["listingFeature"]) => void;
}) {
  const active = isListingFeatureActive(service);
  const [enabled, setEnabled] = useState(active);
  const [days, setDays] = useState(String(Number(service.listingFeature?.days) > 0 ? service.listingFeature?.days : 7));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const promo = service.socialMediaPromotion;

  useEffect(() => {
    setEnabled(isListingFeatureActive(service));
    setDays(String(Number(service.listingFeature?.days) > 0 ? service.listingFeature?.days : 7));
  }, [service]);

  const save = async (nextEnabled: boolean) => {
    const nDays = Math.floor(Number(days));
    if (nextEnabled && (!Number.isInteger(nDays) || nDays < 1 || nDays > 90)) {
      setError("Enter a whole number of days from 1 to 90.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await apiRequest<{ data?: { listingFeature?: AdminService["listingFeature"] } }>(
        `/admin/services/${service._id}/listing-feature`,
        { method: "PATCH", body: { enabled: nextEnabled, days: nextEnabled ? nDays : undefined } },
      );
      if (!res?.data?.listingFeature) {
        setError("Could not update featuring.");
        return;
      }
      onUpdated(res.data.listingFeature);
      setMessage(nextEnabled ? "This work is now featured on the list." : "Featuring was turned off.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update featuring.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Panel title="Feature on work list">
        <Text style={styles.meta}>Pin this work at the top of the services list with a Featured badge.</Text>
        {active ? <Badge label="Currently featured" tone="amber" /> : null}
        <View style={styles.switchRow}>
          <Text style={styles.body}>Enable featuring</Text>
          <Switch value={enabled} onValueChange={setEnabled} disabled={saving} />
        </View>
        <View style={styles.pills}>
          {DAY_PRESETS.map((preset) => (
            <Pressable key={preset} disabled={!enabled || saving} onPress={() => setDays(String(preset))} style={[styles.pill, days === String(preset) && styles.pillOn]}>
              <Text style={[styles.pillText, days === String(preset) && { color: "#fff" }]}>{preset} days</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Feature for (days)" value={days} onChangeText={setDays} keyboardType="number-pad" />
        <InfoLine label="Expires" value={formatWhen(service.listingFeature?.expiresAt)} />
        <Action icon="star" label={saving ? "Saving…" : "Save featuring"} disabled={saving} onPress={() => save(enabled)} />
        {enabled && active ? <Action icon="star-outline" label="Turn featuring off" color={colors.muted} disabled={saving} onPress={() => save(false)} /> : null}
        {error ? <Banner text={error} /> : null}
        {message ? <Banner text={message} tone="ok" /> : null}
      </Panel>
      <Panel title="Social media promotion">
        <InfoLine label="Status" value={label(promo?.status)} />
        <InfoLine label="Amount" value={promo?.amount ? `₹${promo.amount}` : "—"} />
        <InfoLine label="Paid at" value={formatWhen(promo?.paidAt)} />
        <InfoLine label="Order ID" value={promo?.orderId || "—"} copy />
      </Panel>
    </View>
  );
}

function Technical({ service }: { service: AdminService }) {
  const employer = personOf(service.employer);
  const worker = personOf(service.bookedWorker);
  return (
    <View style={{ gap: 12 }}>
      <Panel title="Identifiers">
        <InfoLine label="Work ID" value={service._id} copy />
        <InfoLine label="Job ID" value={service.jobID || "—"} copy />
        <InfoLine label="Employer ID" value={employer?._id || (typeof service.employer === "string" ? service.employer : "—")} copy />
        <InfoLine label="Booked worker ID" value={worker?._id || "—"} copy />
        <InfoLine label="Upload status" value={label(service.uploadStatus)} />
      </Panel>
      <Panel title="Geo location">
        <Text selectable style={styles.json}>
          {JSON.stringify(service.geoLocation ?? null, null, 2)}
        </Text>
      </Panel>
      <Panel title="Applied skill">
        <Text selectable style={styles.json}>
          {JSON.stringify(service.appliedSkill ?? null, null, 2)}
        </Text>
      </Panel>
      <Panel title="Full record">
        <Text selectable style={styles.json}>
          {JSON.stringify(service, null, 2)}
        </Text>
      </Panel>
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
  header: { backgroundColor: "#fff", borderRadius: 18, padding: 14, gap: 6, borderWidth: 1, borderColor: colors.line },
  job: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  title: { fontSize: 20, fontWeight: "800", color: colors.ink },
  meta: { color: colors.muted, fontSize: 13 },
  body: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  photo: { width: 140, height: 100, borderRadius: 12, backgroundColor: colors.line },
  req: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  linkText: { color: colors.primary, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 12, gap: 6, borderWidth: 1, borderColor: colors.line },
  person: { flexDirection: "row", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  letter: { color: "#fff", fontWeight: "800" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.soft },
  pillOn: { backgroundColor: colors.primary },
  pillText: { fontWeight: "700", color: colors.ink },
  json: { color: "#14532d", fontSize: 12, fontFamily: "Courier" },
});
