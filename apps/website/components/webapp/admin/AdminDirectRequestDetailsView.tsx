"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  IndianRupee,
  MapPin,
  Phone,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type AdminPerson = {
  _id?: string;
  name?: string;
  mobile?: string;
  role?: string;
  address?: string;
  profilePicture?: string;
  status?: string;
  registrationSource?: string;
  email?: { value?: string } | string;
};

export type DirectRequestRecord = {
  _id: string;
  status?: string;
  startDate?: string;
  duration?: string | number;
  address?: string;
  description?: string;
  requiredNumberOfWorkers?: number;
  images?: string[];
  facilities?: Record<string, boolean>;
  appliedSkill?: { skill?: string; payPerDay?: number | string };
  type?: string;
  subType?: string;
  employer?: AdminPerson | string;
  bookedWorker?: AdminPerson | string;
  createdAt?: string;
  updatedAt?: string;
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

const STATUS_HELP: Record<string, string> = {
  PENDING: "Waiting for the receiver to accept or reject this booking.",
  ACCEPTED: "The receiver accepted. This booking is confirmed.",
  REJECTED: "The receiver declined this booking.",
  CANCELLED: "This booking was cancelled.",
  REMOVED: "The employer removed the worker from this booking.",
  LEFT: "The worker left this booking.",
};

function text(value: unknown, fallback = "Not added") {
  if (value == null) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function person(value?: AdminPerson | string | null): AdminPerson | null {
  if (!value || typeof value === "string") return null;
  return value;
}

function personId(value?: AdminPerson | string | null) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
}

function emailOf(email?: AdminPerson["email"]) {
  if (!email) return "Not added";
  if (typeof email === "string") return text(email);
  return text(email.value);
}

function formatWhen(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusTone(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "PENDING":
      return "border-amber-300/70 bg-amber-500/35 text-white";
    case "ACCEPTED":
      return "border-emerald-300/70 bg-emerald-500/35 text-white";
    case "REJECTED":
      return "border-rose-300/70 bg-rose-500/35 text-white";
    case "CANCELLED":
      return "border-white/30 bg-white/15 text-white";
    case "REMOVED":
    case "LEFT":
      return "border-orange-300/70 bg-orange-500/35 text-white";
    default:
      return "border-white/25 bg-white/20 text-white";
  }
}

function Copyable({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value || value === "Not added" || value === "Not set") {
    return <span>{value}</span>;
  }
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
  icon: typeof Briefcase;
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

function PartyCard({
  label,
  people,
  fallbackId,
}: {
  label: string;
  people: AdminPerson | null;
  fallbackId?: string;
}) {
  const name = text(people?.name, fallbackId ? "Unknown person" : "Unknown person");
  const role = ROLE_LABELS[String(people?.role || "").toUpperCase()] || text(people?.role, "");
  return (
    <div className="min-w-0 rounded-xl border border-white/25 bg-white/15 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-100">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        {people?.profilePicture ? (
          <img
            src={people.profilePicture}
            alt={name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white/40"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-base font-bold ring-2 ring-white/30">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-white">{name}</p>
          <p className="truncate text-xs text-indigo-100">
            {[role, people?.mobile || fallbackId].filter(Boolean).join(" · ") ||
              "Details not loaded"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PersonSection({
  title,
  people,
  fallbackId,
}: {
  title: string;
  people: AdminPerson | null;
  fallbackId?: string;
}) {
  if (!people) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {fallbackId
          ? `User record is not loaded. ID: ${fallbackId}`
          : "This person is not available."}
      </div>
    );
  }

  const role = ROLE_LABELS[String(people.role || "").toUpperCase()] || text(people.role);
  const source = SOURCE_LABELS[String(people.registrationSource || "").toLowerCase()] ||
    text(people.registrationSource);

  return (
    <div className="rounded-2xl border border-[#22409a]/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        {people.profilePicture ? (
          <img
            src={people.profilePicture}
            alt={text(people.name)}
            className="h-12 w-12 rounded-xl object-cover ring-1 ring-[#22409a]/15"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#22409a] text-lg font-bold text-white">
            {text(people.name, "U").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#22409a]/75">
            {title}
          </p>
          <p className="text-base font-bold text-[#16264f]">{text(people.name)}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Mobile" value={<Copyable value={text(people.mobile)} />} />
        <InfoCard label="Role" value={role} />
        <InfoCard label="Account status" value={text(people.status)} />
        <InfoCard label="Joined via" value={source} />
        <InfoCard
          label="Email"
          value={<Copyable value={emailOf(people.email)} />}
          className="sm:col-span-2"
        />
        <InfoCard
          label="Address"
          value={text(people.address)}
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
}

export default function AdminDirectRequestDetailsView({
  request,
}: {
  request: DirectRequestRecord;
}) {
  const { t } = useLanguage();
  const sender = person(request.employer);
  const receiver = person(request.bookedWorker);
  const status = String(request.status || "").toUpperCase();
  const skillKey = text(request.appliedSkill?.skill, "");
  const skillLabel = skillKey ? t(skillKey, skillKey) : "Skill not specified";
  const pay = request.appliedSkill?.payPerDay;
  const workers = Number(request.requiredNumberOfWorkers || 0);
  const duration = request.duration != null && String(request.duration).trim()
    ? `${request.duration} day${Number(request.duration) === 1 ? "" : "s"}`
    : "Not set";
  const facilities = Object.entries(request.facilities || {});

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#1c3788] via-[#22409a] to-[#355ed8] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
          Direct booking request
        </p>
        <h3 className="mt-1 text-2xl font-bold">{skillLabel}</h3>
        <p className="mt-1 text-sm text-indigo-100">
          {STATUS_HELP[status] || "Booking invitation sent by an employer."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full border px-2.5 py-1 font-semibold ${statusTone(status)}`}>
            {text(status, "Unknown")}
          </span>
          {workers ? (
            <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold">
              {workers} worker{workers === 1 ? "" : "s"} needed
            </span>
          ) : null}
          {pay != null && String(pay).trim() ? (
            <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 font-semibold">
              ₹{pay} / day
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <PartyCard
            label="From employer"
            people={sender}
            fallbackId={personId(request.employer)}
          />
          <div className="hidden justify-center text-white/80 sm:flex">
            <ArrowRight size={22} />
          </div>
          <PartyCard
            label="To receiver"
            people={receiver}
            fallbackId={personId(request.bookedWorker)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          label="Pay per day"
          value={
            pay != null && String(pay).trim() ? (
              <span className="inline-flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-[#22409a]" />
                {pay}
              </span>
            ) : (
              "Not set"
            )
          }
          accent="from-[#eef9ff] to-white"
        />
        <InfoCard
          label="Workers needed"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#22409a]" />
              {workers || "Not set"}
            </span>
          }
        />
        <InfoCard
          label="Duration"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#22409a]" />
              {duration}
            </span>
          }
        />
        <InfoCard
          label="Work start"
          value={
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-[#22409a]" />
              {formatWhen(request.startDate)}
            </span>
          }
        />
      </div>

      <Section title="Work location" icon={MapPin}>
        <div className="rounded-xl border border-[#22409a]/10 bg-gradient-to-br from-[#f8faff] to-white p-4">
          <p className="text-sm font-semibold leading-relaxed text-[#16264f]">
            {text(request.address, "No work address added")}
          </p>
        </div>
      </Section>

      <Section title="Work description" icon={Briefcase}>
        <p className="rounded-xl border border-[#22409a]/10 bg-[#fafcff] p-3 text-sm leading-relaxed text-slate-700">
          {text(request.description, "No description provided.")}
        </p>
      </Section>

      {facilities.length ? (
        <Section title="Facilities" icon={CheckCircle2}>
          <div className="grid gap-2 sm:grid-cols-2">
            {facilities.map(([key, value]) => (
              <div
                key={key}
                className={`rounded-xl border p-3 text-sm ${
                  value
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-rose-200 bg-rose-50/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold capitalize text-[#16264f]">
                    {t(key, key.replace(/_/g, " "))}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      value
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {value ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {value ? "Included" : "Not included"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {request.images?.length ? (
        <Section title="Photos" icon={Briefcase}>
          <div className="grid gap-3 sm:grid-cols-3">
            {request.images.map((src) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-[#22409a]/10"
              >
                <img src={src} alt="Work photo" className="h-36 w-full object-cover" />
              </a>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Employer" icon={UserRound}>
          <PersonSection
            title="Sent this request"
            people={sender}
            fallbackId={personId(request.employer)}
          />
        </Section>
        <Section title="Receiver" icon={Phone}>
          <PersonSection
            title="Asked to join this work"
            people={receiver}
            fallbackId={personId(request.bookedWorker)}
          />
        </Section>
      </div>

      <Section title="Request record" icon={Clock}>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard
            label="Request ID"
            value={<Copyable value={request._id} />}
            className="sm:col-span-2"
          />
          <InfoCard label="Created" value={formatWhen(request.createdAt)} />
          <InfoCard label="Last updated" value={formatWhen(request.updatedAt)} />
        </div>
      </Section>
    </div>
  );
}
