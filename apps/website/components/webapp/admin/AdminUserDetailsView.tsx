"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Briefcase,
  CheckCircle2,
  Check,
  Copy,
  ExternalLink,
  Heart,
  IdCard,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import VerifiedBadge from "@/components/commons/VerifiedBadge";
import {
  isVerifiableRole,
  normalizeVerification,
  VERIFICATION_STATUS,
  type VerificationStatus,
} from "@/lib/userVerification";

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

export type UserDetailsTab = "overview" | "activity" | "verification" | "account";

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

export const ROLE_LABELS: Record<string, string> = {
  WORKER: "Worker",
  EMPLOYER: "Employer",
  MEDIATOR: "Contractor",
  ADMIN: "Admin",
};

export const SOURCE_LABELS: Record<string, string> = {
  android: "Android app",
  ios: "iOS app",
  web: "Website",
};

export function text(value: unknown, fallback = "Not added") {
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

export function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function skillItems(
  skills: unknown,
): Array<{ name: string; pay?: string }> {
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

function geoCoords(geo?: { coordinates?: number[] }) {
  const [lng, lat] = geo?.coordinates || [];
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (Number(lat) === 0 && Number(lng) === 0)
  ) {
    return null;
  }
  return { lat: Number(lat), lng: Number(lng) };
}

export default function AdminUserDetailsView({
  user,
  tab,
  onVerificationChange,
  verificationSaving = false,
  onWhatsapp,
}: {
  user: AdminUserRecord;
  tab: UserDetailsTab;
  onVerificationChange?: (verification: VerificationStatus) => void;
  verificationSaving?: boolean;
  onWhatsapp: (templateId?: "welcome") => void;
}) {
  const role = String(user.role || "").toUpperCase();
  const status = String(user.status || "").toUpperCase();
  const verification = normalizeVerification(user.verification);
  const canVerify = isVerifiableRole(role);
  const source = String(user.registrationSource || "").toLowerCase();
  const language = String(user.locale?.language || "").toLowerCase();
  const skills = skillItems(user.skills);
  const coords = geoCoords(user.geoLocation);
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

  const roleStats =
    role === "EMPLOYER"
      ? [
          { label: "Jobs posted", value: nestedNumber(user.serviceDetails, ["byService", "total"]) },
          { label: "Jobs completed", value: nestedNumber(user.serviceDetails, ["byService", "completed"]) },
          { label: "Jobs pending", value: nestedNumber(user.serviceDetails, ["byService", "pending"]) },
          { label: "Direct requests sent", value: nestedNumber(user.serviceDetails, ["directBooking", "sentRequests"]) },
        ]
      : role === "MEDIATOR"
        ? [
            { label: "Team size", value: Number(user.numberOfWorkersInTeam || 0) },
            { label: "Applied for jobs", value: nestedNumber(user.mediatorDetails, ["applied"]) },
            { label: "Selected", value: nestedNumber(user.mediatorDetails, ["selected"]) },
            { label: "Completed", value: nestedNumber(user.mediatorDetails, ["completed"]) },
          ]
        : [
            { label: "Applications sent", value: nestedNumber(user.workDetails, ["byService", "appliedIndividually", "applied"]) },
            { label: "Selected for work", value: nestedNumber(user.workDetails, ["byService", "appliedIndividually", "selected"]) },
            { label: "Work completed", value: nestedNumber(user.workDetails, ["byService", "appliedIndividually", "completed"]) },
            { label: "Direct requests received", value: nestedNumber(user.workDetails, ["directBooking", "recievedRequests"]) },
          ];

  const ratingLabel = ratingCount
    ? `${ratingAverage.toFixed(1)} / 5 · ${ratingCount} review${ratingCount === 1 ? "" : "s"}`
    : "No reviews yet";

  if (tab === "overview") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatTile icon={Briefcase} label={roleStats[0].label} value={String(roleStats[0].value)} tone="blue" />
          <StatTile icon={CheckCircle2} label={roleStats[1].label} value={String(roleStats[1].value)} tone="emerald" />
          <StatTile icon={Star} label={roleStats[2].label} value={String(roleStats[2].value)} tone="violet" />
          <StatTile icon={Users} label={roleStats[3].label} value={String(roleStats[3].value)} tone="slate" />
          <StatTile icon={Star} label="Rating" value={ratingCount ? ratingAverage.toFixed(1) : "—"} tone="amber" />
          <StatTile
            icon={Wallet}
            label={role === "EMPLOYER" ? "Spent on work" : "Earned from work"}
            value={rupees(role === "EMPLOYER" ? user.spent?.work : user.earnings?.work)}
            tone="rose"
            small
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Card title="Contact" icon={Phone}>
              <InfoRow label="Mobile" value={phone} copy />
              <InfoRow label="Email" value={email} copy />
              <InfoRow
                label="Email verification"
                value={user.email?.isVerified ? "Verified" : "Not verified"}
                icon={user.email?.isVerified ? CheckCircle2 : Mail}
                iconClass={user.email?.isVerified ? "text-emerald-600" : "text-amber-600"}
              />
              <InfoRow
                label="Notifications"
                value={user.notificationConsent === false ? "Turned off" : "Turned on"}
                icon={Bell}
                iconClass={user.notificationConsent === false ? "text-slate-400" : "text-[#22409a]"}
              />
            </Card>

            <Card title="Personal details" icon={UserRound}>
              <div className="grid gap-x-8 sm:grid-cols-2">
                <InfoRow label="Gender" value={text(user.gender)} />
                <InfoRow label="Age" value={text(user.age)} />
                <InfoRow label="Date of birth" value={text(user.dateOfBirth)} />
                <InfoRow
                  label="Language"
                  value={LANGUAGE_LABELS[language] || text(user.locale?.language)}
                  icon={Languages}
                  iconClass="text-[#22409a]"
                />
              </div>
              <InfoRow label="Aadhaar" value={text(user.aadhaarNumber)} copy />
            </Card>

            <Card title="Skills" icon={Briefcase}>
              {skills.length ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={`${skill.name}-${skill.pay || "na"}`}
                      className="rounded-full border border-[#22409a]/15 bg-[#eef3ff] px-3 py-1.5 text-sm font-semibold text-[#16264f]"
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
                <EmptyNote text="No skills added yet." />
              )}
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Card title="Address & location" icon={MapPin}>
              <p className="text-sm font-semibold leading-relaxed text-[#16264f]">
                {text(user.address, "No address added")}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {coords
                  ? `Map pin: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                  : "Location pin not shared"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user.address ? <CopyChip value={user.address} label="Copy address" /> : null}
                {coords ? (
                  <a
                    href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#22409a] transition hover:bg-[#eef3ff]"
                  >
                    <ExternalLink size={13} />
                    Open in Maps
                  </a>
                ) : null}
              </div>
            </Card>

            <Card title="Welcome message" icon={MessageCircle}>
              <p className="text-sm text-slate-600">
                Send the role-based welcome message with the community WhatsApp
                group link to {text(user.name, "this user")}.
              </p>
              <button
                type="button"
                onClick={() => onWhatsapp("welcome")}
                disabled={!user.mobile}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#1fb857] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle size={16} />
                Preview &amp; send welcome
              </button>
            </Card>

            <Card title="Rating" icon={Star}>
              <p className="text-sm font-semibold text-[#16264f]">{ratingLabel}</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "activity") {
    return (
      <div className="space-y-4">
        <Card title="Work activity" icon={Briefcase}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {roleStats.map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-[#16264f]">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Engagement" icon={Heart}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {activity.map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-0.5 text-2xl font-bold text-[#16264f]">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Rating" icon={Star}>
            <p className="text-lg font-bold text-[#16264f]">{ratingLabel}</p>
          </Card>
          <Card title="Earnings" icon={Wallet}>
            <InfoRow label="From work" value={rupees(user.earnings?.work)} />
            <InfoRow label="Rewards" value={rupees(user.earnings?.rewards)} />
          </Card>
          <Card title="Spent" icon={Wallet}>
            <InfoRow label="On work" value={rupees(user.spent?.work)} />
            <InfoRow label="Tips" value={rupees(user.spent?.tip)} />
          </Card>
        </div>
      </div>
    );
  }

  if (tab === "verification") {
    return (
      <Card title="Verification" icon={ShieldCheck}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#22409a]/15 bg-[#eef3ff] px-3 py-1 text-sm font-bold text-[#16264f]">
            {verification}
          </span>
          <VerifiedBadge user={user} showLabel />
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          {canVerify
            ? "Mark labour, employer, or mediator profiles as verified after review. Completed users show a verification mark on their profile."
            : "Admin accounts cannot be marked as verified users."}
        </p>
        {canVerify && onVerificationChange ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? isComplete
                        ? "border-[#22409a] bg-[#22409a] text-white shadow-md"
                        : "border-[#22409a]/30 bg-[#eef3ff] text-[#22409a]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#22409a]/30 hover:bg-[#f8faff]"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <span className="flex items-center justify-between">
                    {value}
                    {active ? <Check size={16} /> : null}
                  </span>
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
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card title="Account record" icon={IdCard}>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <InfoRow label="User ID" value={text(user._id)} copy mono />
          <InfoRow label="Role" value={ROLE_LABELS[role] || text(user.role)} />
          <InfoRow label="Joined" value={formatDate(user.createdAt)} />
          <InfoRow label="Last updated" value={formatDate(user.updatedAt)} />
          <InfoRow
            label="Joined via"
            value={SOURCE_LABELS[source] || text(user.registrationSource, "Unknown")}
          />
          <InfoRow
            label="Account safety"
            value={status === "ACTIVE" ? "Can use the app" : `Currently ${text(status)}`}
            icon={ShieldCheck}
            iconClass="text-[#22409a]"
          />
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────── Shared UI pieces ───────────────────────── */

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef3ff] text-[#22409a]">
          <Icon size={15} />
        </span>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      </div>
      {children}
    </section>
  );
}

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  small,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: keyof typeof TONES;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className={`truncate font-bold text-slate-900 ${small ? "text-base" : "text-xl"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  copy,
  mono,
  icon: Icon,
  iconClass = "",
}: {
  label: string;
  value: string;
  copy?: boolean;
  mono?: boolean;
  icon?: LucideIcon;
  iconClass?: string;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(copy && value && value !== "Not added");
  return (
    <div className="group flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <p className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="flex min-w-0 items-start gap-1.5">
        {Icon ? <Icon size={15} className={`mt-0.5 shrink-0 ${iconClass}`} /> : null}
        <p
          className={`break-words text-right text-sm font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
        {canCopy ? (
          <button
            type="button"
            title={`Copy ${label}`}
            aria-label={`Copy ${label}`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1400);
              } catch {
                setCopied(false);
              }
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 opacity-0 transition hover:border-[#22409a]/30 hover:text-[#22409a] focus:opacity-100 group-hover:opacity-100"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyNote({ text: message }: { text: string }) {
  return (
    <p className="rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500">
      {message}
    </p>
  );
}

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {copied ? "Copied" : label}
    </button>
  );
}
