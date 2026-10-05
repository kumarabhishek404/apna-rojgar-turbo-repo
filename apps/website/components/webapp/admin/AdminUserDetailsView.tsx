"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Briefcase,
  CheckCircle2,
  Copy,
  ExternalLink,
  IdCard,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import VerifiedBadge from "@/components/commons/VerifiedBadge";
import {
  isVerifiableRole,
  normalizeVerification,
  VERIFICATION_STATUS,
  type VerificationStatus,
} from "@/lib/userVerification";
import {
  buildNewUserWhatsappWelcome,
  getWhatsappGroupLabelForRole,
  getWhatsappGroupLinkForRole,
  openWhatsappUserChat,
  whatsappChatUrl,
} from "@/lib/newUserWhatsappWelcome";

export type AdminUserRecord = {
  _id: string;
  name?: string;
  mobile?: string;
  countryCode?: string;
  role?: string;
  status?: string;
  registrationSource?: string;
  createdAt?: string;
  updatedAt?: string;
  profilePicture?: string;
  email?: { value?: string; isVerified?: boolean };
  gender?: string;
  age?: string;
  dateOfBirth?: string;
  aadhaarNumber?: string;
  address?: string;
  locale?: { language?: string };
  notificationConsent?: boolean;
  numberOfWorkersInTeam?: number;
  geoLocation?: { coordinates?: number[] };
  skills?: unknown;
  likedUsers?: unknown[];
  likedServices?: unknown[];
  likedBy?: unknown[];
  bookingRequestBy?: unknown[];
  myBookings?: unknown[];
  bookedBy?: unknown[];
  savedAddresses?: unknown[];
  workDetails?: Record<string, unknown>;
  serviceDetails?: Record<string, unknown>;
  mediatorDetails?: Record<string, unknown>;
  rating?: { average?: number; count?: number };
  earnings?: { work?: number; rewards?: number };
  spent?: { work?: number; tip?: number };
  verification?: VerificationStatus | string;
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  bn: "Bengali",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
  rj: "Rajasthani",
  ks: "Kashmiri",
};

const ROLE_LABELS: Record<string, string> = {
  WORKER: "Worker",
  EMPLOYER: "Employer",
  MEDIATOR: "Contractor",
  ADMIN: "Admin",
};

const SOURCE_LABELS: Record<string, string> = {
  android: "Android app",
  ios: "iOS app",
  web: "Website",
};

function text(value: unknown, fallback = "Not added") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function count(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function rupees(value: unknown) {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN")}`;
}

function nestedNumber(source: unknown, path: string[]) {
  let current: unknown = source;
  for (const key of path) {
    if (!current || typeof current !== "object") return 0;
    current = (current as Record<string, unknown>)[key];
  }
  const n = Number(current);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusTone(status?: string) {
  const key = String(status || "").toUpperCase();
  if (key === "ACTIVE") return "border-emerald-300/70 bg-emerald-500/30 text-white";
  if (key === "PENDING") return "border-amber-300/70 bg-amber-500/35 text-white";
  if (key === "SUSPENDED") return "border-rose-300/70 bg-rose-500/35 text-white";
  if (key === "DISABLED" || key === "DELETED") {
    return "border-slate-300/70 bg-slate-500/35 text-white";
  }
  return "border-white/25 bg-white/20 text-white";
}

function skillItems(skills: unknown): Array<{ name: string; pay?: string }> {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((item) => {
      if (typeof item === "string") return { name: item };
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = text(row.skill || row.name || row.type, "");
      if (!name) return null;
      const pay = row.pricePerDay ?? row.payPerDay;
      return {
        name,
        pay: pay != null && String(pay).trim() ? `₹${pay}/day` : undefined,
      };
    })
    .filter((item): item is { name: string; pay?: string } => Boolean(item));
}

function geoLabel(geo?: { coordinates?: number[] }) {
  const [lng, lat] = geo?.coordinates || [];
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (Number(lat) === 0 && Number(lng) === 0)
  ) {
    return "";
  }
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

function WelcomeWhatsappCard({
  name,
  role,
  countryCode,
  mobile,
}: {
  name?: string;
  role?: string;
  countryCode?: string;
  mobile?: string;
}) {
  const [copied, setCopied] = useState(false);
  const message = useMemo(
    () => buildNewUserWhatsappWelcome(name, role),
    [name, role],
  );
  const groupLabel = useMemo(() => getWhatsappGroupLabelForRole(role), [role]);
  const groupLink = useMemo(() => getWhatsappGroupLinkForRole(role), [role]);
  const chat = useMemo(
    () => whatsappChatUrl(countryCode, mobile, message),
    [countryCode, mobile, message],
  );

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const sendOnWhatsapp = () => {
    void navigator.clipboard.writeText(message).catch(() => undefined);
    openWhatsappUserChat(countryCode, mobile, message);
  };

  return (
    <Section title="Welcome WhatsApp" icon={MessageCircle}>
      <div className="overflow-hidden rounded-xl border border-[#25D366]/25 bg-gradient-to-br from-[#f3fff7] to-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#25D366]/15 bg-[#25D366]/8 px-3.5 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#0b5c32]">
              इस यूज़र की भूमिका के हिसाब से तैयार संदेश — कॉपी करके WhatsApp पर भेजें
            </p>
            <a
              href={groupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#128C7E] underline-offset-2 hover:underline"
            >
              ग्रुप: अपना रोजगार - {groupLabel}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            {chat ? (
              <button
                type="button"
                onClick={sendOnWhatsapp}
                title={`WhatsApp chat खोलें: +${chat.phone}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1fb855]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Send
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void copyMessage()}
              title={copied ? "Copied" : "Copy WhatsApp message"}
              aria-label="Copy WhatsApp welcome message"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-white px-2.5 py-1.5 text-xs font-bold text-[#0b5c32] transition hover:bg-[#f3fff7]"
            >
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-3.5 py-3 font-sans text-[13px] leading-relaxed text-[#16264f]">
          {message}
        </pre>
      </div>
    </Section>
  );
}

function Copyable({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  if (!value || value === "Not added") return <span>{value}</span>;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex max-w-full items-center gap-1.5 text-left"
      title={`Copy ${label}`}
    >
      <span className="break-all">{value}</span>
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-[#22409a]/70" />
      )}
    </button>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22409a]/10 text-[#22409a]">
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="text-sm font-bold text-[#16264f]">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function InfoCard({
  label,
  value,
  className = "",
  accent = "from-[#f8faff] to-white",
}: {
  label: string;
  value: ReactNode;
  className?: string;
  accent?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#22409a]/10 bg-gradient-to-br ${accent} p-3.5 shadow-sm ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/75">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold leading-snug text-[#16264f]">
        {value}
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#22409a]/12 bg-gradient-to-r from-[#f8faff] to-[#f2f6ff] px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/70">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold text-[#16264f]">{value}</p>
    </div>
  );
}

function verificationTone(status?: string) {
  const key = normalizeVerification(status);
  if (key === VERIFICATION_STATUS.COMPLETED) {
    return "border-emerald-300/70 bg-emerald-500/35 text-white";
  }
  if (key === VERIFICATION_STATUS.APPLIED) {
    return "border-sky-300/70 bg-sky-500/35 text-white";
  }
  return "border-amber-300/70 bg-amber-500/35 text-white";
}

export default function AdminUserDetailsView({
  user,
  onVerificationChange,
  verificationSaving = false,
}: {
  user: AdminUserRecord;
  onVerificationChange?: (verification: VerificationStatus) => void;
  verificationSaving?: boolean;
}) {
  const role = String(user.role || "").toUpperCase();
  const status = String(user.status || "").toUpperCase();
  const verification = normalizeVerification(user.verification);
  const canVerify = isVerifiableRole(role);
  const source = String(user.registrationSource || "").toLowerCase();
  const language = String(user.locale?.language || "").toLowerCase();
  const skills = skillItems(user.skills);
  const location = geoLabel(user.geoLocation);
  const phone = user.mobile
    ? `+${text(user.countryCode, "91")} ${user.mobile}`
    : "Not added";
  const email = text(user.email?.value);
  const ratingAverage = Number(user.rating?.average || 0);
  const ratingCount = Number(user.rating?.count || 0);

  const activity = useMemo(
    () => [
      { label: "Skills added", value: skills.length },
      { label: "Saved jobs", value: count(user.likedServices) },
      { label: "People liked", value: count(user.likedUsers) },
      { label: "Liked by others", value: count(user.likedBy) },
      { label: "Jobs booked", value: count(user.myBookings) },
      { label: "Times booked", value: count(user.bookedBy) },
      { label: "Booking requests", value: count(user.bookingRequestBy) },
      { label: "Saved addresses", value: count(user.savedAddresses) },
    ],
    [skills.length, user],
  );

  const workerStats = [
    {
      label: "Applications sent",
      value: nestedNumber(user.workDetails, [
        "byService",
        "appliedIndividually",
        "applied",
      ]),
    },
    {
      label: "Selected for work",
      value: nestedNumber(user.workDetails, [
        "byService",
        "appliedIndividually",
        "selected",
      ]),
    },
    {
      label: "Work completed",
      value: nestedNumber(user.workDetails, [
        "byService",
        "appliedIndividually",
        "completed",
      ]),
    },
    {
      label: "Direct requests received",
      value: nestedNumber(user.workDetails, ["directBooking", "recievedRequests"]),
    },
  ];

  const employerStats = [
    {
      label: "Jobs posted",
      value: nestedNumber(user.serviceDetails, ["byService", "total"]),
    },
    {
      label: "Jobs completed",
      value: nestedNumber(user.serviceDetails, ["byService", "completed"]),
    },
    {
      label: "Jobs pending",
      value: nestedNumber(user.serviceDetails, ["byService", "pending"]),
    },
    {
      label: "Direct requests sent",
      value: nestedNumber(user.serviceDetails, ["directBooking", "sentRequests"]),
    },
  ];

  const mediatorStats = [
    {
      label: "Team size",
      value: Number(user.numberOfWorkersInTeam || 0),
    },
    { label: "Applied for jobs", value: nestedNumber(user.mediatorDetails, ["applied"]) },
    { label: "Selected", value: nestedNumber(user.mediatorDetails, ["selected"]) },
    { label: "Completed", value: nestedNumber(user.mediatorDetails, ["completed"]) },
  ];

  const roleStats =
    role === "EMPLOYER"
      ? employerStats
      : role === "MEDIATOR"
        ? mediatorStats
        : workerStats;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#1c3788] via-[#22409a] to-[#355ed8] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={text(user.name, "User")}
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/40"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold ring-2 ring-white/30">
              {text(user.name, "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
              User profile
            </p>
            <h3 className="flex items-center gap-2 truncate text-2xl font-bold">
              <span className="truncate">{text(user.name, "Unnamed user")}</span>
              <VerifiedBadge user={user} size="lg" tone="onDark" showLabel />
            </h3>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold">
                {ROLE_LABELS[role] || text(user.role, "Role not set")}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 font-semibold ${statusTone(status)}`}
              >
                {text(status, "Unknown status")}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 font-semibold ${verificationTone(verification)}`}
              >
                Verification · {verification}
              </span>
              <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold">
                Joined via {SOURCE_LABELS[source] || text(user.registrationSource, "unknown source")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {activity.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-white p-3.5 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/75">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-bold leading-tight text-[#16264f]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Contact" icon={Phone}>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              label="Mobile"
              value={<Copyable value={phone} label="mobile" />}
              accent="from-[#eef9ff] to-white"
            />
            <InfoCard
              label="Email"
              value={<Copyable value={email} label="email" />}
              className="sm:col-span-2"
            />
            <InfoCard
              label="Email verification"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {user.email?.isVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Mail className="h-4 w-4 text-amber-600" />
                  )}
                  {user.email?.isVerified ? "Verified" : "Not verified"}
                </span>
              }
            />
            <InfoCard
              label="Notifications"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-[#22409a]" />
                  {user.notificationConsent === false ? "Turned off" : "Turned on"}
                </span>
              }
            />
          </div>
        </Section>

        <Section title="Personal details" icon={UserRound}>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label="Gender" value={text(user.gender)} />
            <InfoCard label="Age" value={text(user.age)} />
            <InfoCard label="Date of birth" value={text(user.dateOfBirth)} />
            <InfoCard
              label="Language"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-[#22409a]" />
                  {LANGUAGE_LABELS[language] || text(user.locale?.language)}
                </span>
              }
            />
            <InfoCard
              label="Aadhaar"
              value={<Copyable value={text(user.aadhaarNumber)} label="Aadhaar" />}
              className="sm:col-span-2"
            />
          </div>
        </Section>
      </div>

      <Section title="Address & location" icon={MapPin}>
        <div className="rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-800">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/85">
                Current address
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-[#16264f]">
                {text(user.address, "No address added")}
              </p>
              {location ? (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Map pin: {location}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Location pin not shared</p>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Skills" icon={Briefcase}>
        {skills.length ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={`${skill.name}-${skill.pay || "na"}`}
                className="rounded-full border border-[#22409a]/15 bg-gradient-to-r from-[#f8faff] to-[#eef3ff] px-3 py-1.5 text-sm font-semibold text-[#16264f]"
              >
                {skill.name}
                {skill.pay ? (
                  <span className="ml-1.5 text-xs font-medium text-[#22409a]/80">
                    {skill.pay}
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#22409a]/10 bg-[#fafcff] p-3 text-sm text-slate-600">
            No skills added yet.
          </div>
        )}
      </Section>

      <Section title="Work activity" icon={Briefcase}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {roleStats.map((item) => (
            <StatChip key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Rating" icon={Star}>
          <InfoCard
            label="Average from reviews"
            value={
              ratingCount
                ? `${ratingAverage.toFixed(1)} / 5 · ${ratingCount} review${ratingCount === 1 ? "" : "s"}`
                : "No reviews yet"
            }
            accent="from-[#fff8e8] to-white"
          />
        </Section>
        <Section title="Earnings" icon={Wallet}>
          <div className="grid gap-3">
            <InfoCard label="From work" value={rupees(user.earnings?.work)} />
            <InfoCard label="Rewards" value={rupees(user.earnings?.rewards)} />
          </div>
        </Section>
        <Section title="Spent" icon={Wallet}>
          <div className="grid gap-3">
            <InfoCard label="On work" value={rupees(user.spent?.work)} />
            <InfoCard label="Tips" value={rupees(user.spent?.tip)} />
          </div>
        </Section>
      </div>

      <Section title="Verification" icon={ShieldCheck}>
        <div className="rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#22409a]/75">
                Current status
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full border border-[#22409a]/15 bg-white px-3 py-1 text-sm font-bold text-[#16264f]">
                  {verification}
                </span>
                <VerifiedBadge user={user} showLabel />
              </div>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                {canVerify
                  ? "Mark labour, employer, or mediator profiles as verified after review. Completed users show a verification mark on their profile."
                  : "Admin accounts cannot be marked as verified users."}
              </p>
            </div>
          </div>
          {canVerify && onVerificationChange ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(
                [
                  VERIFICATION_STATUS.PENDING,
                  VERIFICATION_STATUS.APPLIED,
                  VERIFICATION_STATUS.COMPLETED,
                ] as const
              ).map((value) => {
                const active = verification === value;
                const isComplete = value === VERIFICATION_STATUS.COMPLETED;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={verificationSaving || active}
                    onClick={() => onVerificationChange(value)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active
                        ? isComplete
                          ? "border-[#22409a] bg-[#22409a] text-white"
                          : "border-[#22409a]/30 bg-[#eef3ff] text-[#22409a]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#22409a]/30 hover:bg-[#f8faff]"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <span className="block">{value}</span>
                    <span
                      className={`mt-0.5 block text-[11px] font-medium ${
                        active && isComplete ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      {value === VERIFICATION_STATUS.PENDING
                        ? "Not reviewed yet"
                        : value === VERIFICATION_STATUS.APPLIED
                          ? "Request received"
                          : "Show verified mark"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </Section>

      <Section title="Account record" icon={IdCard}>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard
            label="User ID"
            value={<Copyable value={user._id} label="user ID" />}
            className="sm:col-span-2"
          />
          <InfoCard
            label="Joined"
            value={formatDate(user.createdAt)}
            accent="from-[#eef3ff] to-white"
          />
          <InfoCard
            label="Last updated"
            value={formatDate(user.updatedAt)}
            accent="from-[#f3f5ff] to-white"
          />
          <InfoCard
            label="Account safety"
            value={
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#22409a]" />
                {status === "ACTIVE" ? "Can use the app" : `Currently ${text(status)}`}
              </span>
            }
            className="sm:col-span-2"
          />
        </div>
      </Section>

      <WelcomeWhatsappCard
        name={user.name}
        role={user.role}
        countryCode={user.countryCode}
        mobile={user.mobile}
      />
    </div>
  );
}
