"use client";

import ServicesPage from "@/app/webapp/services/ServicesPageClient";
import ProfilePage from "@/app/webapp/profile/page";
import MyWorkPage from "@/app/webapp/my-services/page";
import SettingsPage from "@/app/webapp/settings/page";
import AdminUsersPage from "@/app/webapp/admin/users/page";
import AdminErrorLogsPage from "@/app/webapp/admin/error-logs/page";
import AdminAnalyticsPage from "@/app/webapp/admin/analytics/page";
import AdminNotificationsPage from "@/app/webapp/admin/notifications/page";
import ServicesToolbarFilters from "@/components/services/ServicesToolbarFilters";
import type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";
import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { apiRequest, clearAuth, getAuth } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { isAdminUser } from "@/lib/isAdminUser";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  Download,
  ShieldAlert,
  ShieldCheck,
  Users,
  Info,
  LogOut,
  Menu,
  Plus,
  type LucideIcon,
  Settings,
  Share2,
  Languages,
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

/** Home `/` renders the same “all services” view as `/all-services`; keep sidebar highlight in sync. */
function isPrimaryNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/all-services" && pathname === "/") return true;
  return false;
}

function DashboardSidebarContent({
  pathname,
  router,
  primaryItems,
  bottomItems,
  userPhoto,
  userName,
  userMobile,
  userInitial,
  viewProfileLabel,
  onNavigate,
  onDismiss,
  brandSurface = "sidebar",
  onShareWebsite,
  onShareApp,
}: {
  pathname: string;
  router: ReturnType<typeof useRouter>;
  primaryItems: PrimaryNavItem[];
  bottomItems: BottomNavItem[];
  userPhoto: string;
  userName: string;
  userMobile: string;
  userInitial: string;
  viewProfileLabel: string;
  onNavigate?: () => void;
  onDismiss?: () => void;
  brandSurface?: "sidebar" | "drawer";
  onShareWebsite?: () => void;
  onShareApp?: () => void;
}) {
  const { t } = useLanguage();
  const isDrawer = brandSurface === "drawer";
  const gutter = isDrawer ? "px-4" : "px-0.5";
  const dividerInset = isDrawer ? "mx-4" : "";
  const isProfileActive = pathname === "/my-profile";

  const brandSidebar =
    "group w-[calc(100%+2rem)] -mx-4 -mt-4 flex min-h-[4.75rem] shrink-0 items-center gap-3 rounded-t-3xl border-b border-slate-200/80 bg-white px-4 py-3.5 transition-colors hover:bg-slate-50/95";
  const brandDrawerShell =
    "flex w-full min-h-[4.75rem] shrink-0 items-stretch overflow-hidden rounded-tr-3xl border-b border-slate-200/80 bg-white pt-[max(1rem,env(safe-area-inset-top,0px))]";
  const brandLinkInner =
    "group flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/95";

  const navItemBase =
    brandSurface === "drawer"
      ? "flex min-h-[2.875rem] cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium transition duration-150 active:scale-[0.99]"
      : "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition duration-150";
  const navInactive = `${navItemBase} text-white/[0.88] hover:bg-white/12 hover:text-white`;
  const navActive = `${navItemBase} bg-white text-[#152a5c] shadow-[0_6px_20px_rgba(0,0,0,0.18)]`;
  const navMotion = {
    whileHover: { x: 3, scale: 1.01 },
    whileTap: { scale: 0.985 },
    transition: { duration: 0.16, ease: "easeOut" as const },
  };

  const brandMark = (
    <>
      <span className="relative aspect-square h-[2.5rem] w-[2.5rem] shrink-0 overflow-hidden rounded-full bg-transparent">
        <Image
          src={LOGO}
          alt=""
          fill
          sizes="40px"
          className="rounded-full object-contain"
          priority
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1.9rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#1a2f69] transition-colors group-hover:text-[#22409a]">
          {t("brandName", "Apna Rojgar")}
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isDrawer && onDismiss ? (
        <div className={brandDrawerShell}>
          <Link
            href="/"
            aria-label="Apna Rojgar home"
            className={brandLinkInner}
            onClick={onNavigate}
          >
            {brandMark}
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="flex min-w-[3.25rem] cursor-pointer items-center justify-center border-l border-slate-200/70 text-slate-500 transition hover:bg-slate-100 active:bg-slate-200/80"
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
        <Link
          href="/my-profile"
          onClick={onNavigate}
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 transition ${
            isProfileActive
              ? "bg-white/12 ring-1 ring-white/20"
              : "hover:bg-white/8"
          }`}
        >
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
            <p className="truncate text-sm font-semibold text-white">
              {userName}
            </p>
            <p className="truncate text-xs text-white/80">
              {userMobile || "No mobile number"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#d5e2ff]">
              {viewProfileLabel}
            </p>
          </div>
        </Link>
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
                <motion.div key={item.label} {...navMotion}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onNavigate}
                    className={navInactive}
                  >
                    <Icon
                      size={18}
                      className="shrink-0 text-white/75"
                      strokeWidth={1.75}
                    />
                    <span>{item.label}</span>
                  </a>
                </motion.div>
              );
            }

            const active = isPrimaryNavActive(pathname, item.href);
            return (
              <motion.div key={item.label} {...navMotion}>
                <Link
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
              </motion.div>
            );
          })}
        </div>

        <div
          className={`my-4 h-px shrink-0 bg-gradient-to-r from-transparent via-white/15 to-transparent ${dividerInset}`}
        />

        {isDrawer ? (
          <div className="mb-4 space-y-2">
            <a
              href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
              target="_blank"
              rel="noreferrer"
              onClick={onNavigate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Download size={16} />
              {t("installApp", "Install App")}
            </a>
            <button
              type="button"
              onClick={() => {
                onShareWebsite?.();
                onNavigate?.();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Share2 size={16} />
              {t("shareWebsite", "Share Website")}
            </button>
            <button
              type="button"
              onClick={() => {
                onShareApp?.();
                onNavigate?.();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-[#22409a] transition hover:bg-[#eef3ff]"
            >
              <Share2 size={16} />
              {t("shareAppLink", "Share App Link")}
            </button>
          </div>
        ) : null}

        <div
          className={`mt-auto space-y-0.5 ${isDrawer ? "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]" : "pb-0.5"}`}
        >
          {bottomItems.map((item) => {
            const Icon = item.icon;
            if (item.href === "/logout") {
              return (
                <motion.div key={item.label} {...navMotion}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.();
                      clearAuth();
                      router.push("/");
                    }}
                    className={`${navItemBase} w-full text-left text-red-200 hover:bg-red-500/20 hover:text-red-50`}
                  >
                    <Icon
                      size={18}
                      className="shrink-0 text-red-300"
                      strokeWidth={1.75}
                    />
                    <span>{item.label}</span>
                  </button>
                </motion.div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <motion.div key={item.label} {...navMotion}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={isActive ? navActive : navInactive}
                >
                  <Icon
                    size={18}
                    className={
                      isActive
                        ? "shrink-0 text-[#22409a]"
                        : "shrink-0 text-white/80"
                    }
                    strokeWidth={1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function ServicesDashboard() {
  const { t, language, setLanguage } = useLanguage();
  const currentYear = 2024;
  const pathname = usePathname();
  const isProfileView = pathname === "/my-profile";
  const isMyWorkView = pathname === "/my-work";
  const isAppliedView = pathname === "/applied-service";
  const isAboutView = pathname === "/about";
  const isSettingsView = pathname === "/settings";
  const isAdminUsersView =
    pathname === "/admin/users" || pathname === "/webapp/admin/users";
  const isAdminErrorLogsView =
    pathname === "/admin/error-logs" || pathname === "/webapp/admin/error-logs";
  const isAdminAnalyticsView =
    pathname === "/admin/analytics" || pathname === "/webapp/admin/analytics";
  const isAdminNotificationsView =
    pathname === "/admin/notifications" ||
    pathname === "/webapp/admin/notifications";
  const isAllServicesView = pathname === "/all-services" || pathname === "/";
  const isAppliedServiceRoute = pathname === "/applied-service";
  /** Same list chrome (merged toolbar on scroll) for browse + applied jobs. */
  const isServicesListView = isAllServicesView || isAppliedServiceRoute;
  const router = useRouter();
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const languageMenuRef = useRef<HTMLDivElement | null>(null);
  const [filtersMerged, setFiltersMerged] = useState(false);
  const [toolbarApi, setToolbarApi] = useState<ServicesToolbarApi | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const [userName, setUserName] = useState("User");
  const [userMobile, setUserMobile] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const userInitial = userName.charAt(0).toUpperCase();

  const primaryItems = useMemo(() => {
    const baseItems: PrimaryNavItem[] = [
        {
          label: t("allServices", "All Services"),
          href: "/all-services",
          icon: BriefcaseBusiness,
        },
        {
          label: t("myServices", "My Services"),
          href: "/my-work",
          icon: ClipboardList,
        },
        {
          label: t("appliedServices", "Applied Services"),
          href: "/applied-service",
          icon: ClipboardList,
        },
        {
          label: t("aboutUs", "About us"),
          href: "/about",
          icon: Info,
        },
        {
          label: t("installApp", "Install App"),
          href: "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
          external: true,
          icon: Download,
        },
    ];
    if (!isAdmin) return baseItems;
    return [
      ...baseItems,
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Error Logs", href: "/admin/error-logs", icon: ShieldAlert },
      { label: "Analytics", href: "/admin/analytics", icon: ShieldCheck },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
    ];
  }, [t, isAdmin]);

  const bottomItems = useMemo(
    () =>
      [
        { label: t("settings", "Settings"), href: "/settings", icon: Settings },
        { label: t("logOut", "Logout"), href: "/logout", icon: LogOut },
      ] satisfies BottomNavItem[],
    [t],
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
      setIsAdmin(
        isAdminUser({
          role:
            typeof userData.role === "string"
              ? userData.role
              : null,
          mobile:
            typeof userData.mobile === "string" ||
            typeof userData.mobile === "number"
              ? userData.mobile
              : null,
        }),
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let mounted = true;
    apiRequest<{ data?: { role?: string; mobile?: string | number } }>(
      "/user/info",
    )
      .then((res) => {
        if (!mounted) return;
        setIsAdmin(
          isAdminUser({
            role: res?.data?.role || null,
            mobile: res?.data?.mobile || null,
          }),
        );
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
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

  useEffect(() => {
    if (!languageOpen) return;
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        languageMenuRef.current &&
        target &&
        !languageMenuRef.current.contains(target)
      ) {
        setLanguageOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [languageOpen]);

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
  const microLift = {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { scale: 0.985 },
    transition: { duration: 0.16, ease: "easeOut" as const },
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
    viewProfileLabel: t("viewYourProfile", "View Your Profile"),
    onShareWebsite: () =>
      shareLink(window.location.origin, "Apna Rojgar Website"),
    onShareApp: () =>
      shareLink(
        "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
        "Apna Rojgar App",
      ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf0ff] via-[#f6f8ff] to-white p-3 md:p-5 lg:h-screen lg:overflow-hidden">
      {/* Mobile slide-in menu */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileNavOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
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
                  <motion.button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="inline-flex shrink-0 cursor-pointer rounded-xl border border-[#22409a]/20 bg-white p-2 text-[#22409a] shadow-sm transition hover:bg-[#eef3ff] lg:hidden"
                    aria-label="Open menu"
                    {...microLift}
                  >
                    <Menu size={22} />
                  </motion.button>
                  <h1 className="min-w-0 truncate text-lg font-bold tracking-tight text-[#16264f] md:text-xl">
                    {isProfileView
                      ? t("myProfile", "My Profile")
                      : isMyWorkView
                        ? t("myServices", "My Services")
                        : isAppliedView
                          ? t("appliedServices", "Applied Services")
                          : isAboutView
                            ? t("aboutUs", "About us")
                            : isSettingsView
                              ? t("settings", "Settings")
                              : isAdminUsersView
                                ? "Users"
                                : isAdminErrorLogsView
                                  ? "Error Logs"
                                  : isAdminAnalyticsView
                                    ? "Analytics"
                                    : isAdminNotificationsView
                                      ? "Notifications"
                              : t("allServices")}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative" ref={languageMenuRef}>
                    <motion.button
                      type="button"
                      onClick={() => setLanguageOpen((prev) => !prev)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#22409a]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf3ff]"
                      aria-haspopup="menu"
                      aria-expanded={languageOpen}
                      {...microLift}
                    >
                      <Languages size={14} />
                      {language === "hi" ? "हिन्दी" : "English"}
                    </motion.button>
                    {languageOpen ? (
                      <div
                        role="menu"
                        className="absolute right-0 z-30 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setLanguage("en");
                            setLanguageOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                            language === "en"
                              ? "bg-[#eef3ff] font-semibold text-[#22409a]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                          role="menuitem"
                        >
                          <span>English</span>
                          {language === "en" ? <span>✓</span> : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLanguage("hi");
                            setLanguageOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                            language === "hi"
                              ? "bg-[#eef3ff] font-semibold text-[#22409a]"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                          role="menuitem"
                        >
                          <span>हिन्दी</span>
                          {language === "hi" ? <span>✓</span> : null}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <motion.a
                    href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#22409a]/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#22409a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf3ff] lg:px-3"
                    {...microLift}
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">{t("installApp", "Install App")}</span>
                  </motion.a>
                  <motion.button
                    type="button"
                    onClick={() =>
                      shareLink(window.location.origin, "Apna Rojgar Website")
                    }
                    className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-[#22409a]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#edf3ff] lg:inline-flex"
                    {...microLift}
                  >
                    <Share2 size={14} />
                    {t("shareWebsite", "Share Website")}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() =>
                      shareLink(
                        "https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp",
                        "Apna Rojgar App",
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#22409a] to-[#3154bf] px-2.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(34,64,154,0.25)] transition hover:-translate-y-0.5 hover:from-[#1d3889] hover:to-[#2947a8] lg:px-3"
                    {...microLift}
                  >
                    <Share2 size={14} />
                    <span className="hidden sm:inline">{t("shareAppLink", "Share App Link")}</span>
                  </motion.button>
                </div>
              </div>
              {isServicesListView && filtersMerged && toolbarApi ? (
                <div className="min-w-0 border-t border-slate-200/80 pt-3">
                  <ServicesToolbarFilters api={toolbarApi} />
                </div>
              ) : null}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="rounded-3xl border border-slate-200/90 bg-white p-3 shadow-[0_20px_50px_rgba(34,64,154,0.08)] md:p-4"
            >
              {isProfileView ? (
                <ProfilePage />
              ) : isMyWorkView ? (
                <MyWorkPage />
              ) : isAppliedView ? (
                <Suspense
                  fallback={
                    <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
                      Loading…
                    </div>
                  }
                >
                  <ServicesPage
                    forcedTab="applied"
                    filtersMerged={isServicesListView ? filtersMerged : false}
                    onFiltersMergedChange={setFiltersMerged}
                    onRegisterToolbar={setToolbarApi}
                    scrollContainerRef={mainScrollRef}
                  />
                </Suspense>
              ) : isSettingsView ? (
                <SettingsPage />
              ) : isAdminUsersView ? (
                <AdminUsersPage />
              ) : isAdminErrorLogsView ? (
                <AdminErrorLogsPage />
              ) : isAdminAnalyticsView ? (
                <AdminAnalyticsPage />
              ) : isAdminNotificationsView ? (
                <AdminNotificationsPage />
              ) : (
                <Suspense
                  fallback={
                    <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
                      Loading…
                    </div>
                  }
                >
                  <ServicesPage
                    filtersMerged={isServicesListView ? filtersMerged : false}
                    onFiltersMergedChange={setFiltersMerged}
                    onRegisterToolbar={setToolbarApi}
                    scrollContainerRef={mainScrollRef}
                  />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="pb-2 pt-1 text-center text-xs text-slate-500">
            {"\u00a9"} {currentYear} {t("apnaRojgarIndia", "Apna Rojgar India")}
            . {t("allRightsReserved", "All rights reserved.")}
          </div>
        </main>
      </div>
    </div>
  );
}
