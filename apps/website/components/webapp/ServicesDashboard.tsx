"use client";

import ServicesPage from "@/app/webapp/services/ServicesPageClient";
import ServicesToolbarFilters from "@/components/services/ServicesToolbarFilters";
import type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getAuth } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import {
  BriefcaseBusiness,
  Download,
  Info,
  LogOut,
  Menu,
  Plus,
  type LucideIcon,
  Settings,
  Share2,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import LOGO from "@/public/logo.png";

type PrimaryNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

type BottomNavItem = { label: string; href: string; icon: LucideIcon };

function DashboardSidebarContent({
  pathname,
  router,
  primaryItems,
  bottomItems,
  userPhoto,
  userName,
  userMobile,
  userInitial,
  onNavigate,
  onDismiss,
  brandSurface = "sidebar",
}: {
  pathname: string;
  router: ReturnType<typeof useRouter>;
  primaryItems: PrimaryNavItem[];
  bottomItems: BottomNavItem[];
  userPhoto: string;
  userName: string;
  userMobile: string;
  userInitial: string;
  onNavigate?: () => void;
  onDismiss?: () => void;
  brandSurface?: "sidebar" | "drawer";
}) {
  const isDrawer = brandSurface === "drawer";
  const gutter = isDrawer ? "px-4" : "px-0.5";
  const dividerInset = isDrawer ? "mx-4" : "";

  const brandSidebar =
    "group w-[calc(100%+2rem)] -mx-4 -mt-4 flex min-h-[3.875rem] shrink-0 items-center gap-3 rounded-t-3xl border-b border-slate-200/80 bg-white px-4 py-3 transition-colors hover:bg-slate-50/95";
  const brandDrawerShell =
    "flex w-full min-h-[3.875rem] shrink-0 items-stretch overflow-hidden rounded-tr-3xl border-b border-slate-200/80 bg-white pt-[max(1rem,env(safe-area-inset-top,0px))]";
  const brandLinkInner =
    "group flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/95";

  const navItemBase =
    brandSurface === "drawer"
      ? "flex min-h-[2.875rem] items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium transition duration-150 active:scale-[0.99]"
      : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition duration-150";
  const navInactive = `${navItemBase} text-white/[0.88] hover:bg-white/12 hover:text-white`;
  const navActive = `${navItemBase} bg-white text-[#152a5c] shadow-[0_6px_20px_rgba(0,0,0,0.18)]`;

  const brandMark = (
    <>
      <span className="relative aspect-square h-[2.375rem] w-[2.375rem] shrink-0 overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-200/70">
        <Image
          src={LOGO}
          alt=""
          fill
          sizes="38px"
          className="rounded-full object-contain p-1.5"
          priority
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.05rem] font-bold leading-snug tracking-[-0.025em] text-[#152a5c] transition-colors group-hover:text-[#22409a]">
          Apna Rojgar
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isDrawer && onDismiss ? (
        <div className={brandDrawerShell}>
          <Link href="/" aria-label="Apna Rojgar home" className={brandLinkInner} onClick={onNavigate}>
            {brandMark}
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="flex min-w-[3.25rem] items-center justify-center border-l border-slate-200/70 text-slate-500 transition hover:bg-slate-100 active:bg-slate-200/80"
            aria-label="Close menu"
          >
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <Link href="/" aria-label="Apna Rojgar home" className={brandSidebar}>
          {brandMark}
        </Link>
      )}

      <div
        className={`mb-4 mt-0 h-px shrink-0 bg-gradient-to-r from-transparent via-white/20 to-transparent ${dividerInset}`}
        aria-hidden
      />

      <div className={`mb-1 flex shrink-0 items-center gap-3 py-1 ${gutter}`}>
        {userPhoto ? (
          <img
            src={userPhoto}
            alt={userName}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-white/50 shadow-md ring-offset-2 ring-offset-[#1e3f8a]"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-sm font-bold text-white shadow-inner backdrop-blur-sm">
            {userInitial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="truncate text-xs text-white/60">{userMobile || "No mobile number"}</p>
        </div>
      </div>

      <div
        className={`mb-4 h-px shrink-0 bg-gradient-to-r from-transparent via-white/20 to-transparent ${dividerInset}`}
        aria-hidden
      />

      <nav
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden ${isDrawer ? "touch-pan-y overscroll-y-contain px-4" : ""}`}
      >
        <div className="space-y-0.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onNavigate}
                  className={navInactive}
                >
                  <Icon size={18} className="shrink-0 text-white/75" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </a>
              );
            }

            const active = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={active ? navActive : navInactive}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${active ? "text-[#22409a]" : "text-white/80"}`}
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div
          className={`my-4 h-px shrink-0 bg-gradient-to-r from-transparent via-white/15 to-transparent ${dividerInset}`}
        />

        <div
          className={`mt-auto space-y-0.5 ${isDrawer ? "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]" : "pb-0.5"}`}
        >
          {bottomItems.map((item) => {
            const Icon = item.icon;
            if (item.label === "Logout") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onNavigate?.();
                    clearAuth();
                    router.push("/");
                  }}
                  className={`${navItemBase} w-full text-left text-red-200 hover:bg-red-500/20 hover:text-red-50`}
                >
                  <Icon size={18} className="shrink-0 text-red-300" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </button>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={isActive ? navActive : navInactive}
              >
                <Icon
                  size={18}
                  className={isActive ? "shrink-0 text-[#22409a]" : "shrink-0 text-white/80"}
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function ServicesDashboard() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const [filtersMerged, setFiltersMerged] = useState(false);
  const [toolbarApi, setToolbarApi] = useState<ServicesToolbarApi | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const [userName, setUserName] = useState("User");
  const [userMobile, setUserMobile] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const userInitial = userName.charAt(0).toUpperCase();

  const primaryItems = useMemo(
    () =>
      [
        {
          label: "My Services",
          href: "/my-work",
          icon: BriefcaseBusiness,
        },
        {
          label: "My Profile",
          href: "/my-profile",
          icon: User,
        },
        {
          label: "Applied Services",
          href: "/applied-service",
          icon: BriefcaseBusiness,
        },
        {
          label: "About us",
          href: "/about",
          icon: Info,
        },
        {
          label: "Install App",
          href: "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
          external: true,
          icon: Download,
        },
      ] satisfies PrimaryNavItem[],
    [],
  );

  const bottomItems = useMemo(
    () =>
      [
        { label: "Settings", href: "/settings", icon: Settings },
        { label: "Logout", href: "/logout", icon: LogOut },
      ] satisfies BottomNavItem[],
    [],
  );

  useEffect(() => {
    const auth = getAuth();
    const userData = (auth?.user || {}) as Record<string, unknown>;
    const nextName =
      (typeof userData.name === "string" && userData.name) ||
      (typeof auth?.name === "string" && auth.name) ||
      "User";
    const nextMobile =
      (typeof userData.mobile === "string" && userData.mobile) ||
      (typeof userData.phone === "string" && userData.phone) ||
      "";
    const nextPhoto =
      (typeof userData.profilePic === "string" && userData.profilePic) ||
      (typeof userData.profileImage === "string" && userData.profileImage) ||
      (typeof userData.avatar === "string" && userData.avatar) ||
      "";

    const id = requestAnimationFrame(() => {
      setUserName(nextName);
      setUserMobile(nextMobile);
      setUserPhoto(nextPhoto);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      closeMobileNav();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen, closeMobileNav]);

  const shareLink = async (url: string, title: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard.");
    } catch {
      // noop for dismissed share action
    }
  };

  const sidebarProps = {
    pathname,
    router,
    primaryItems,
    bottomItems,
    userPhoto,
    userName,
    userMobile,
    userInitial,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf0ff] via-[#f6f8ff] to-white p-3 md:p-5 lg:h-screen lg:overflow-hidden">
      {/* Mobile slide-in menu */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileNavOpen}
        onClick={closeMobileNav}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 flex min-h-0 w-[min(22rem,92vw)] max-w-full flex-col overflow-hidden rounded-r-3xl border-y border-r border-white/10 bg-gradient-to-b from-[#152a64] via-[#1e3f8a] to-[#22409a] pb-4 pt-0 shadow-[12px_0_36px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="min-h-0 flex-1 overflow-hidden overscroll-y-contain">
          <DashboardSidebarContent
            {...sidebarProps}
            brandSurface="drawer"
            onDismiss={closeMobileNav}
            onNavigate={closeMobileNav}
          />
        </div>
      </div>

      <div className="mx-auto flex h-full w-full max-w-[1400px] gap-4">
        <aside className="hidden w-72 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#152a64] via-[#1e3f8a] to-[#22409a] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.14)] lg:sticky lg:top-0 lg:block lg:h-[calc(100vh-2.5rem)] lg:max-h-[calc(100vh-2.5rem)]">
          <DashboardSidebarContent {...sidebarProps} />
        </aside>

        <main
          ref={mainScrollRef}
          className="min-w-0 flex-1 space-y-4 lg:h-[calc(100vh-2.5rem)] lg:overflow-y-auto lg:pr-1"
        >
          <div className="sticky top-0 z-20 min-w-0 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_4px_24px_rgba(15,23,42,0.08)] backdrop-blur transition-shadow duration-200">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="inline-flex shrink-0 rounded-xl border border-[#22409a]/20 bg-white p-2 text-[#22409a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eef3ff] lg:hidden"
                    aria-label="Open menu"
                  >
                    <Menu size={22} />
                  </button>
                  <h1 className="min-w-0 truncate text-lg font-bold tracking-tight text-[#16264f] md:text-xl">
                    {t("allServices")}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#22409a]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf3ff]"
                  >
                    <Download size={14} />
                    Install App
                  </a>
                  <button
                    type="button"
                    onClick={() => shareLink(window.location.origin, "Apna Rojgar Website")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#22409a]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf3ff]"
                  >
                    <Share2 size={14} />
                    Share Website
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      shareLink(
                        "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
                        "Apna Rojgar App",
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#22409a] to-[#3154bf] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(34,64,154,0.25)] transition hover:-translate-y-0.5 hover:from-[#1d3889] hover:to-[#2947a8]"
                  >
                    <Share2 size={14} />
                    Share App Link
                  </button>
                </div>
              </div>
              {filtersMerged && toolbarApi ? (
                <div className="min-w-0 border-t border-slate-200/80 pt-3">
                  <ServicesToolbarFilters api={toolbarApi} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/90 bg-white p-3 shadow-[0_20px_50px_rgba(34,64,154,0.08)] md:p-4">
            <Suspense
              fallback={
                <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
                  Loading…
                </div>
              }
            >
              <ServicesPage
                filtersMerged={filtersMerged}
                onFiltersMergedChange={setFiltersMerged}
                onRegisterToolbar={setToolbarApi}
                scrollContainerRef={mainScrollRef}
              />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
