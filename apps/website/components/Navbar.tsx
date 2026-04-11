"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Menu, Upload, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import LOGO from "../public/logo.png";
import { useLanguage } from "@/components/LanguageProvider";
import { SOCIAL_BRAND_ICON_BY_ID } from "@/components/social/socialBrandIcons";
import { SOCIAL_NAV_ITEMS } from "@/constants/social";
import {
  clearAuth,
  getAuth,
  loginUser,
  saveAuth,
  validateStoredToken,
} from "@/lib/auth";
import { DEV_OTP_PLACEHOLDER, shouldSkipOtpClient } from "@/lib/devOtp";
import { localizeApiErrorMessage } from "@/lib/i18n";
import { STATES, WORKERTYPES } from "@/constants";

type RegisterRole = "WORKER" | "MEDIATOR" | "EMPLOYER";
type RegisterSkillItem = { skill: string; pricePerDay: number | null };
type UnifiedAuthStep = "mobile" | "otp" | "profile";
type StateDirectory = {
  districts?: Array<{
    district?: string;
    subDistricts?: Array<{
      subDistrict?: string;
      villages?: string[];
    }>;
  }>;
};

/** Map API gender strings to MALE | FEMALE | OTHER so <select value> matches an <option>. */
function normalizeProfileGender(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (upper === "MALE" || upper === "FEMALE" || upper === "OTHER") {
    return upper;
  }
  return "";
}

function NavbarContent() {
  const { t, language, setLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<UnifiedAuthStep>("mobile");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [registerToast, setRegisterToast] = useState("");
  const [registerErrorToast, setRegisterErrorToast] = useState("");
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [profileMissingFields, setProfileMissingFields] = useState<string[]>([]);
  const [showAddressBuilder, setShowAddressBuilder] = useState(true);
  const [registerToken, setRegisterToken] = useState("");
  const [registerUserId, setRegisterUserId] = useState("");
  const [stateDirectory, setStateDirectory] = useState<StateDirectory | null>(null);
  const [addressDataLoading, setAddressDataLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    mobile: "",
    name: "",
    role: "WORKER" as RegisterRole,
    gender: "",
    age: "",
    address: "",
    state: "",
    district: "",
    subDistrict: "",
    village: "",
    pinCode: "",
    additionalDetails: "",
    profileImage: null as File | null,
    profileImagePreview: "",
    geoLocation: null as { type: "Point"; coordinates: [number, number] } | null,
    skills: [] as RegisterSkillItem[],
  });

  const REGISTER_SKILLS = useMemo(
    () =>
      WORKERTYPES.map((item: { label: string; value: string }) => ({
        label: item.label,
        value: item.value,
      })),
    [],
  );
  const dropdownBaseClass =
    "w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 pr-10 text-slate-800 shadow-sm transition focus:border-[#22409a] focus:outline-none focus:ring-4 focus:ring-[#22409a]/10 disabled:cursor-not-allowed disabled:bg-slate-100";

  const districtOptions = useMemo(
    () =>
      (stateDirectory?.districts || [])
        .map((entry) => entry?.district || "")
        .filter(Boolean),
    [stateDirectory],
  );

  const subDistrictOptions = useMemo(() => {
    const district = stateDirectory?.districts?.find(
      (entry) => entry?.district === registerForm.district,
    );
    return (district?.subDistricts || [])
      .map((entry) => entry?.subDistrict || "")
      .filter(Boolean);
  }, [stateDirectory, registerForm.district]);

  const villageOptions = useMemo(() => {
    const district = stateDirectory?.districts?.find(
      (entry) => entry?.district === registerForm.district,
    );
    const subDistrict = district?.subDistricts?.find(
      (entry) => entry?.subDistrict === registerForm.subDistrict,
    );
    return (subDistrict?.villages || []).filter(Boolean);
  }, [stateDirectory, registerForm.district, registerForm.subDistrict]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnScroll = () => {
      setMenuOpen(false);
    };

    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => window.removeEventListener("scroll", closeOnScroll);
  }, [menuOpen]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const auth = getAuth();
      if (!auth?.token) {
        if (active) setIsLoggedIn(false);
        return;
      }
      const valid = await validateStoredToken();
      if (active) setIsLoggedIn(valid);
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("login") !== "1") return;
    setShowLoginModal(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const showLoginButton = !isLoggedIn;

  const menuItems: Array<{ name: string; link: string }> = [];

  const webAppItems = isLoggedIn
    ? [{ name: t("dashboard", "Dashboard"), link: "/all-services" }]
    : [];
  const openLoginModal = () => {
    setAuthError("");
    setAuthMessage("");
    setOtpSessionId(null);
    setAuthStep("mobile");
    setMissingProfileFields([]);
    setProfileMissingFields([]);
    setShowAddressBuilder(true);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setMobile("");
    setOtp("");
    setOtpSessionId(null);
    setAuthStep("mobile");
    setAuthError("");
    setAuthMessage("");
    setMissingProfileFields([]);
    setProfileMissingFields([]);
    setShowAddressBuilder(true);
    setRegisterToken("");
    setRegisterUserId("");
    setStateDirectory(null);
    setAddressDataLoading(false);
    setRegisterForm({
      mobile: "",
      name: "",
      role: "WORKER",
      gender: "",
      age: "",
      address: "",
      state: "",
      district: "",
      subDistrict: "",
      village: "",
      pinCode: "",
      additionalDetails: "",
      profileImage: null,
      profileImagePreview: "",
      geoLocation: null,
      skills: [],
    });
  };

  const showMissingDetailsToast = () => {
    setRegisterErrorToast(
      t("missingProfileDetailsToast", "Some details are missing. Please fill highlighted fields."),
    );
    window.setTimeout(() => setRegisterErrorToast(""), 2600);
  };

  const clearMissingField = (field: string) => {
    setMissingProfileFields((prev) => prev.filter((item) => item !== field));
  };

  const requestOtp = async () => {
    setAuthError("");
    setAuthMessage("");
    if (!mobile.trim()) {
      setAuthError(t("mobileNumberIsRequired", "Mobile number is required"));
      return;
    }
    if (shouldSkipOtpClient()) {
      await verifyOtp(DEV_OTP_PLACEHOLDER);
      return;
    }
    setAuthLoading(true);
    try {
      const response = await loginUser({ mobile: mobile.trim() });
      setOtpSessionId(
        typeof response?.otpSessionId === "string" && response.otpSessionId.trim()
          ? response.otpSessionId.trim()
          : null,
      );
      setAuthStep("otp");
      setAuthMessage(response?.message || t("otpSentSuccess", "OTP sent successfully"));
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : t("otpSentFail", "Failed to send OTP"),
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyOtp = async (otpOverride?: string) => {
    setAuthError("");
    setAuthMessage("");
    const code = (otpOverride ?? otp).trim();
    if (!code) {
      setAuthError(t("otpRequired", "Code is required"));
      return;
    }
    setAuthLoading(true);
    try {
      const response = await loginUser({
        mobile: mobile.trim(),
        otp: code,
        ...(otpSessionId ? { otpSessionId } : {}),
      });
      const token = response?.token;
      if (!token) {
        throw new Error(t("invalidLoginResponse", "Invalid login response from server."));
      }
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://api.apnarojgarindia.com/api/v1";
      let user = response?.user;
      try {
        const userInfoResponse = await fetch(`${base}/user/info`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const userInfoPayload = await userInfoResponse.json();
        if (userInfoResponse.ok && userInfoPayload?.success !== false) {
          user = userInfoPayload?.data || user;
        }
      } catch {
        // Fallback to login response user payload.
      }
      if (!user?._id) {
        throw new Error(t("invalidLoginResponse", "Invalid login response from server."));
      }
      const normalizedGender = normalizeProfileGender(user?.gender);
      const hasCoreProfile =
        Boolean(user?.name?.trim()) &&
        Boolean(user?.age) &&
        Boolean(normalizedGender) &&
        Boolean(user?.address?.trim());
      const hasRoleSpecificProfile = Boolean(user?.role);
      const resolvedRole =
        user?.role === "WORKER" || user?.role === "MEDIATOR" || user?.role === "EMPLOYER"
          ? user.role
          : "";
      const userSkills = Array.isArray(user?.skills) ? user.skills : [];
      const missingAtOtp: string[] = [];
      if (!user?.name?.trim()) missingAtOtp.push("name");
      if (!user?.age) missingAtOtp.push("age");
      if (!normalizedGender) missingAtOtp.push("gender");
      if (!user?.address?.trim()) missingAtOtp.push("address");
      if (!resolvedRole) missingAtOtp.push("role");
      if (
        (resolvedRole === "WORKER" || resolvedRole === "MEDIATOR") &&
        userSkills.length === 0
      ) {
        missingAtOtp.push("skills");
      }

      if (hasCoreProfile && hasRoleSpecificProfile) {
        saveAuth({ user, token });
        setIsLoggedIn(true);
        closeLoginModal();
        window.location.href = "/all-services";
        return;
      }

      setRegisterToken(token);
      setRegisterUserId(user._id);
      setRegisterForm((prev) => ({
        ...prev,
        mobile: mobile.trim(),
        name: user?.name || prev.name,
        role:
          user?.role === "WORKER" || user?.role === "MEDIATOR" || user?.role === "EMPLOYER"
            ? user.role
            : prev.role,
        gender: normalizeProfileGender(user?.gender) || prev.gender,
        age: user?.age ? String(user.age) : prev.age,
        address: user?.address || prev.address,
        additionalDetails: user?.address || prev.additionalDetails,
        profileImagePreview: user?.profilePicture || prev.profileImagePreview,
        geoLocation: user?.geoLocation || prev.geoLocation,
        skills: Array.isArray(user?.skills)
          ? user.skills.map((item: { skill: string; pricePerDay?: number | null }) => ({
              skill: item.skill,
              pricePerDay: item.pricePerDay ?? null,
            }))
          : prev.skills,
      }));
      showMissingDetailsToast();
      setShowAddressBuilder(!Boolean(user?.address?.trim()));
      setMissingProfileFields([]);
      setProfileMissingFields(missingAtOtp);
      setAuthStep("profile");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : t("otpVerificationFailed", "OTP verification failed"),
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleRegisterSkill = (skill: string) => {
    if (!registerForm.skills.some((item) => item.skill === skill) && registerForm.skills.length >= 5) {
      setAuthError(t("youCanSelectMaxSkills", "You can select maximum 5 skills."));
      return;
    }
    setAuthError("");
    setRegisterForm((prev) => ({
      ...prev,
      skills: prev.skills.some((item) => item.skill === skill)
        ? prev.skills.filter((item) => item.skill !== skill)
        : [
            ...prev.skills,
            {
              skill,
              pricePerDay: prev.role === "WORKER" ? 0 : null,
            },
          ],
    }));
  };

  const updateRegisterSkillPrice = (skill: string, priceRaw: string) => {
    const safe = Number(priceRaw);
    setRegisterForm((prev) => ({
      ...prev,
      skills: prev.skills.map((item) =>
        item.skill === skill
          ? { ...item, pricePerDay: Number.isFinite(safe) ? safe : 0 }
          : item,
      ),
    }));
  };

  const handleRegisterImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    setRegisterForm((prev) => ({
      ...prev,
      profileImage: file,
      profileImagePreview: URL.createObjectURL(file),
    }));
  };

  const fullStructuredAddress = useMemo(
    () =>
      [
        registerForm.additionalDetails.trim(),
        registerForm.village.trim(),
        registerForm.subDistrict.trim(),
        registerForm.district.trim(),
        registerForm.state.trim(),
        registerForm.pinCode.trim(),
      ]
        .filter(Boolean)
        .join(", "),
    [
      registerForm.additionalDetails,
      registerForm.village,
      registerForm.subDistrict,
      registerForm.district,
      registerForm.state,
      registerForm.pinCode,
    ],
  );

  const hasSavedAddress = useMemo(
    () => Boolean(registerForm.address.trim()),
    [registerForm.address],
  );

  const hasStartedStructuredAddress = useMemo(
    () =>
      Boolean(
        registerForm.state ||
          registerForm.district ||
          registerForm.subDistrict ||
          registerForm.village ||
          registerForm.pinCode.trim() ||
          registerForm.additionalDetails.trim(),
      ),
    [
      registerForm.state,
      registerForm.district,
      registerForm.subDistrict,
      registerForm.village,
      registerForm.pinCode,
      registerForm.additionalDetails,
    ],
  );

  const hasCompleteStructuredAddress = useMemo(
    () =>
      Boolean(
        registerForm.state &&
          registerForm.district &&
          registerForm.subDistrict &&
          registerForm.village &&
          registerForm.pinCode.trim().length === 6,
      ),
    [
      registerForm.state,
      registerForm.district,
      registerForm.subDistrict,
      registerForm.village,
      registerForm.pinCode,
    ],
  );

  const shouldShowAllProfileFields = profileMissingFields.length === 0;
  const showNameField = shouldShowAllProfileFields || profileMissingFields.includes("name");
  const showAgeField = shouldShowAllProfileFields || profileMissingFields.includes("age");
  const showGenderField = shouldShowAllProfileFields || profileMissingFields.includes("gender");
  const showAddressField = shouldShowAllProfileFields || profileMissingFields.includes("address");
  const showRoleField = shouldShowAllProfileFields || profileMissingFields.includes("role");
  const showSkillsField = shouldShowAllProfileFields || profileMissingFields.includes("skills");
  const showBasicSection = showNameField || showAgeField || showGenderField;

  useEffect(() => {
    if (!registerForm.state || !registerToken) {
      setStateDirectory(null);
      return;
    }
    let active = true;
    const run = async () => {
      setAddressDataLoading(true);
      try {
        const base =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "https://api.apnarojgarindia.com/api/v1";
        const response = await fetch(
          `${base}/user/state/${encodeURIComponent(registerForm.state)}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${registerToken}` },
          },
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Unable to fetch address data");
        }
        if (active) setStateDirectory(payload?.data || payload || null);
      } catch {
        if (active) setStateDirectory(null);
      } finally {
        if (active) setAddressDataLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [registerForm.state, registerToken]);

  useEffect(() => {
    setRegisterForm((prev) => {
      if (!prev.state) return prev;
      return {
        ...prev,
        district: "",
        subDistrict: "",
        village: "",
      };
    });
  }, [registerForm.state]);

  useEffect(() => {
    setRegisterForm((prev) => {
      if (!prev.district) return prev;
      return {
        ...prev,
        subDistrict: "",
        village: "",
      };
    });
  }, [registerForm.district]);

  useEffect(() => {
    setRegisterForm((prev) => {
      if (!prev.subDistrict) return prev;
      return {
        ...prev,
        village: "",
      };
    });
  }, [registerForm.subDistrict]);

  const completeRegistration = async () => {
    setAuthError("");
    setAuthMessage("");
    if (!registerUserId || !registerToken) {
      setAuthError(
        t("registrationSessionExpired", "Registration session expired. Please start again."),
      );
      setAuthStep("mobile");
      return;
    }
    const missingFields: string[] = [];
    if (!registerForm.name.trim()) missingFields.push("name");
    if (!registerForm.age) missingFields.push("age");
    if (!registerForm.gender) missingFields.push("gender");
    if (!registerForm.role) missingFields.push("role");
    if (showAddressBuilder) {
      const shouldValidateStructuredAddress =
        !hasSavedAddress || hasStartedStructuredAddress;
      if (shouldValidateStructuredAddress && !registerForm.state) missingFields.push("state");
      if (shouldValidateStructuredAddress && !registerForm.district) missingFields.push("district");
      if (shouldValidateStructuredAddress && !registerForm.subDistrict) missingFields.push("subDistrict");
      if (shouldValidateStructuredAddress && !registerForm.village) missingFields.push("village");
      if (
        shouldValidateStructuredAddress &&
        registerForm.pinCode.trim().length !== 6
      ) {
        missingFields.push("pinCode");
      }
    } else if (!registerForm.address.trim()) {
      missingFields.push("address");
    }
    if (
      missingFields.length > 0
    ) {
      setMissingProfileFields(missingFields);
      setAuthError(
        t(
          "completeNameAgeGenderAddress",
          "Please complete name, age, gender and address.",
        ),
      );
      return;
    }
    if (
      (registerForm.role === "WORKER" || registerForm.role === "MEDIATOR") &&
      registerForm.skills.length === 0
    ) {
      setMissingProfileFields((prev) =>
        prev.includes("skills") ? prev : [...prev, "skills"],
      );
      setAuthError(t("selectAtLeastOneSkill", "Select at least one skill"));
      return;
    }
    if (registerForm.role === "WORKER") {
      const invalidPrice = registerForm.skills.some(
        (item) => !item.pricePerDay || Number(item.pricePerDay) <= 0,
      );
      if (invalidPrice) {
        setAuthError(
          t(
            "validPricePerDayForSkills",
            "Please enter valid price/day for selected worker skills.",
          ),
        );
        return;
      }
    }

    setAuthLoading(true);
    try {
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "https://api.apnarojgarindia.com/api/v1";
      const finalAddress = showAddressBuilder
        ? hasCompleteStructuredAddress
          ? fullStructuredAddress
          : registerForm.address.trim()
        : registerForm.address.trim();
      if (!finalAddress) {
        throw new Error(t("addressIsRequired", "Address is required"));
      }
      let geoLocationPayload: { type: "Point"; coordinates: [number, number] } = {
        type: "Point",
        coordinates: [0, 0],
      };
      const isValidCoords = (coords: unknown): coords is [number, number] =>
        Array.isArray(coords) &&
        coords.length === 2 &&
        Number.isFinite(coords[0]) &&
        Number.isFinite(coords[1]) &&
        !(Number(coords[0]) === 0 && Number(coords[1]) === 0);

      if (registerForm.geoLocation && isValidCoords(registerForm.geoLocation.coordinates)) {
        geoLocationPayload = {
          type: "Point",
          coordinates: [
            Number(registerForm.geoLocation.coordinates[0]),
            Number(registerForm.geoLocation.coordinates[1]),
          ],
        };
      }
      try {
        const geocodeCandidates = [
          finalAddress,
          [
            registerForm.village,
            registerForm.subDistrict,
            registerForm.district,
            registerForm.state,
            registerForm.pinCode,
            "India",
          ]
            .filter(Boolean)
            .join(", "),
        ];
        if (!showAddressBuilder) {
          geocodeCandidates.splice(1);
        }

        for (const candidate of geocodeCandidates) {
          if (!candidate?.trim()) continue;
          const locationResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(candidate)}`,
          );
          const locationData = await locationResponse.json();
          const first = Array.isArray(locationData) ? locationData[0] : null;
          if (first?.lat && first?.lon) {
            const lat = Number(first.lat);
            const lon = Number(first.lon);
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              geoLocationPayload = { type: "Point", coordinates: [lon, lat] };
              break;
            }
          }
        }
      } catch {
        // keep fallback [0,0] and continue submission
      }
      const fd = new FormData();
      fd.append("_id", registerUserId);
      fd.append("mobile", registerForm.mobile.trim());
      fd.append("name", registerForm.name.trim());
      fd.append("role", registerForm.role);
      fd.append("gender", registerForm.gender || "");
      fd.append("age", String(Number(registerForm.age)));
      fd.append("address", finalAddress);
      fd.append("savedAddresses", finalAddress);
      fd.append("locale", language);
      fd.append("geoLocation", JSON.stringify(geoLocationPayload));
      if (registerForm.profileImage) {
        fd.append("profileImage", registerForm.profileImage);
      }
      fd.append(
        "skills",
        JSON.stringify(
          registerForm.role === "WORKER" || registerForm.role === "MEDIATOR"
            ? registerForm.skills.map((item) => ({
                skill: item.skill,
                pricePerDay:
                  registerForm.role === "WORKER"
                    ? Number(item.pricePerDay || 0)
                    : null,
              }))
            : [],
        ),
      );

      const response = await fetch(`${base}/user/info`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${registerToken}`,
        },
        body: fd,
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.message?.trim()
            ? localizeApiErrorMessage(String(data.message))
            : t("profileCompletionFailed", "Profile completion failed"),
        );
      }

      saveAuth({
        user: data?.data,
        token: data?.token || registerToken,
      });
      setIsLoggedIn(true);
      setRegisterToast(t("profileCompletedToast", "Profile completed successfully."));
      window.setTimeout(() => setRegisterToast(""), 2500);
      closeLoginModal();
      window.location.href = "/all-services";
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Registration failed",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const profileMenuItems = [
    { name: t("myProfile"), link: "/my-profile" },
    { name: t("settings", "Settings"), link: "/settings" },
  ];

  return (
    <>
      <nav
        className={`-mb-px w-full min-h-[72px] px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "py-4 bg-white/90 backdrop-blur-md shadow-md"
            : "py-0 border-b-2 border-[#22409a] bg-gradient-to-b from-[#23429f] to-[#22409a]"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center gap-3 transition-all duration-300 ${
            scrolled ? "" : "-ml-6 lg:-ml-12 bg-white px-6 lg:px-12 py-4"
          }`}
        >
          <Link
            href="/"
            className="group flex items-center gap-4 cursor-pointer p-0"
          >
            {/* Logo */}
            <div
              className={`flex items-center justify-center transition-all duration-300 ${
                scrolled
                  ? "h-10 w-10"
                  : "h-11 w-11"
              }`}
            >
              <Image
                src={LOGO}
                alt={t("apnaRojgarLogoAlt", "Apna Rojgar Logo")}
                suppressHydrationWarning
                className="rounded-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                width={40}
                height={40}
                priority
              />
            </div>

            {/* Brand Name */}
            <span
              suppressHydrationWarning
              className={`text-[2.2rem] font-extrabold leading-none tracking-[-0.02em] transition-all duration-300 ${
                scrolled
                  ? "text-[#22409a] group-hover:text-[#1b347d]"
                  : "text-[#22409a] group-hover:text-[#1b347d]"
              }`}
            >
              {t("brandName", "Apna Rojgar")}
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <ul
            className={`flex items-center gap-8 font-medium ${
              scrolled ? "text-gray-700" : "text-white"
            }`}
          >
            {[...menuItems, ...webAppItems].map((item, i) => (
              <li key={i}>
                <Link
                  href={item.link}
                  className="hover:text-blue-400 transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            <Link
              target="_blank"
              href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
              className={`hidden sm:inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-300 ${
                scrolled
                  ? "text-[#22409a] hover:bg-[#22409a]/10"
                  : "text-white hover:bg-white/15"
              } animate-pulse`}
            >
              {t("installApp", "Install App")}
            </Link>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
              className={`h-12 min-w-[140px] rounded-lg px-4 text-sm font-medium transition-colors ${
                scrolled
                  ? "border border-gray-300 bg-white text-[#22409a]"
                  : "border border-white/30 bg-white/10 text-white"
              }`}
            >
              <option value="en" className="text-black">
                {t("english")}
              </option>
              <option value="hi" className="text-black">
                {t("hindi")}
              </option>
            </select>
            {showLoginButton ? (
              <button
                type="button"
                onClick={openLoginModal}
                className="h-12 min-w-[140px] rounded-lg bg-[#FFE492] px-4 font-bold text-[#043873] transition hover:bg-[#ffd966]"
              >
                {t("login")}
              </button>
            ) : null}
            <div className="relative">
              {isLoggedIn ? (
                <button
                  onClick={() => setDesktopMenuOpen((prev) => !prev)}
                  className={`rounded-lg p-2 ${scrolled ? "text-[#22409a]" : "text-white"} hover:bg-black/10`}
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
              ) : null}
              {desktopMenuOpen ? (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.link}
                      href={item.link}
                      onClick={() => setDesktopMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      clearAuth();
                      setIsLoggedIn(false);
                      setDesktopMenuOpen(false);
                      window.location.href = "/";
                    }}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    {t("logout")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden z-50"
        >
          {menuOpen ? (
            <X
              size={28}
              className={scrolled ? "text-[#22409a]" : "text-white"}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <span
                className={`w-7 h-1 rounded ${
                  scrolled ? "bg-[#22409a]" : "bg-white"
                }`}
              />
              <span
                className={`w-7 h-1 rounded ${
                  scrolled ? "bg-[#22409a]" : "bg-white"
                }`}
              />
              <span
                className={`w-7 h-1 rounded ${
                  scrolled ? "bg-[#22409a]" : "bg-white"
                }`}
              />
            </div>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close mobile menu backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ y: -300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white shadow-xl"
            >
              <div className="pt-24 pb-10 px-8 flex flex-col gap-6">
              {[...menuItems, ...webAppItems].map((item, i) => (
                <Link
                  key={i}
                  href={item.link}
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-medium text-gray-700 hover:text-[#22409a]"
                >
                  {item.name}
                </Link>
              ))}

              <div className="border-t pt-6 flex flex-col gap-4">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/my-profile"
                      onClick={() => setMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-[#22409a]"
                    >
                      {t("myProfile")}
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-[#22409a]"
                    >
                      {t("settings", "Settings")}
                    </Link>
                    <button
                      onClick={() => {
                        clearAuth();
                        setMenuOpen(false);
                        setIsLoggedIn(false);
                        window.location.href = "/";
                      }}
                      className="text-left text-lg font-medium text-red-600 hover:text-red-700"
                    >
                      {t("logout")}
                    </button>
                  </>
                ) : null}
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="en">{t("english")}</option>
                  <option value="hi">{t("hindi")}</option>
                </select>
                {showLoginButton ? (
                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="bg-[#FFE492] text-center text-[#043873] py-3 rounded-lg font-bold"
                  >
                    {t("login")}
                  </button>
                ) : null}

                <Link
                  target="_blank"
                  href="https://play.google.com/store/apps/details?id=com.kumarabhishek404.labourapp"
                  className="flex justify-center items-center gap-2 bg-[#22409a] text-white py-3 rounded-lg font-semibold"
                >
                  {t("installApp", "Install App")}
                  <ArrowRight size={18} />
                </Link>

                <div className="mt-1 border-t border-gray-200 pt-4">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("followUs", "Follow us")}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {SOCIAL_NAV_ITEMS.map(({ id, href, label }) => {
                      const Icon = SOCIAL_BRAND_ICON_BY_ID[id];
                      return (
                        <a
                          key={id}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer me"
                          aria-label={label}
                          title={label}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-[#22409a] transition hover:bg-slate-100"
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLoginModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          >
            {authLoading && authStep === "profile" ? (
              <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-md">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#22409a]/30 border-t-[#22409a]" />
                  <span className="text-sm font-semibold text-slate-700">
                    {t("submitting", "Submitting...")}
                  </span>
                </div>
              </div>
            ) : null}
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative w-full overflow-y-auto rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 shadow-[0_36px_100px_rgba(15,23,42,0.34)] ring-1 ring-black/5 ${
                authStep === "profile"
                  ? "max-w-4xl max-h-[90vh] p-5 sm:p-6"
                  : "max-w-2xl max-h-[82vh] p-4 sm:p-6"
              }`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#22409a]/12 via-[#3154bf]/5 to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_right,rgba(49,84,191,0.08),transparent_38%)]" />
              <div className="relative z-10">
              <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#22409a]/20 bg-[#22409a]/5 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22409a]" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#22409a]/80">
                      Apna Rojgar
                    </p>
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-[#172554] sm:text-[2rem]">
                    {authStep === "profile"
                      ? t("completeProfileButton", "Complete Profile")
                      : t("login")}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {authStep === "profile"
                      ? t(
                          "registrationFlowHint",
                          "Create account and complete profile in guided steps.",
                        )
                      : t("loginFlowHint", "Secure login in two quick steps.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeLoginModal}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  {t("close", "Close")}
                </button>
              </div>

              <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
                <span
                  className={`rounded-full px-3.5 py-1.5 ${
                    authStep === "mobile"
                      ? "bg-gradient-to-r from-[#22409a] to-[#3154bf] text-white shadow-[0_8px_16px_rgba(34,64,154,0.24)]"
                      : "border border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  1. {t("mobileNumber", "Mobile Number")}
                </span>
                <span
                  className={`rounded-full px-3.5 py-1.5 ${
                    authStep === "otp"
                      ? "bg-gradient-to-r from-[#22409a] to-[#3154bf] text-white shadow-[0_8px_16px_rgba(34,64,154,0.24)]"
                      : "border border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  2. {t("otpCode", "OTP")}
                </span>
                {authStep === "profile" ? (
                  <span className="rounded-full bg-gradient-to-r from-[#22409a] to-[#3154bf] px-3.5 py-1.5 text-white shadow-sm">
                    3. {t("profileStep", "Profile Details")}
                  </span>
                ) : null}
                </div>
              </div>

              <div className="space-y-4">
                {authStep !== "profile" ? (
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        {t("mobileNumber", "Mobile Number")}
                      </label>
                      <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-[#22409a] focus-within:ring-4 focus-within:ring-[#22409a]/10">
                        <span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                          +91
                        </span>
                        <input
                          value={mobile}
                          onChange={(event) => setMobile(event.target.value)}
                          inputMode="numeric"
                          placeholder={t(
                            "enterYourMobileNumber",
                            "Enter mobile number",
                          )}
                          className="w-full px-3.5 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                          disabled={authStep === "otp"}
                        />
                      </div>
                    </div>
                    {authStep === "otp" ? (
                      <>
                        <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-sm font-medium text-slate-600">
                            {t("otpSentTo", "OTP sent to")} <span className="font-semibold text-slate-800">+91 {mobile}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthStep("mobile");
                              setOtp("");
                              setAuthError("");
                              setAuthMessage("");
                            }}
                            className="rounded-full border border-[#22409a]/25 bg-white px-3 py-1 text-xs font-semibold text-[#22409a] transition hover:bg-[#f3f6ff]"
                          >
                            {t("change", "Change")}
                          </button>
                        </div>
                        <div className="mt-1">
                          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                            {t("otpCode", "OTP")}
                          </label>
                          <input
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            inputMode="numeric"
                            maxLength={6}
                            placeholder={t("enterOtp", "Enter OTP")}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 tracking-[0.22em] text-center text-2xl font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#22409a] focus:outline-none focus:ring-4 focus:ring-[#22409a]/10"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {showBasicSection ? (
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                        {t("basicInformation", "Basic Information")}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                            {showNameField ? (
                              <input
                                value={registerForm.name}
                                onChange={(event) =>
                                  setRegisterForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                  }))
                                }
                                placeholder={t("fullName", "Full Name")}
                                onInput={() => clearMissingField("name")}
                                className={`w-full rounded-xl bg-white px-3.5 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                                  missingProfileFields.includes("name")
                                    ? "border border-red-400 focus:border-red-500 focus:ring-red-100"
                                    : "border border-slate-300 focus:border-[#22409a] focus:ring-[#22409a]/10"
                                }`}
                              />
                            ) : null}
                            {showAgeField ? (
                              <input
                                type="number"
                                min={18}
                                value={registerForm.age}
                                onChange={(event) =>
                                  setRegisterForm((prev) => ({
                                    ...prev,
                                    age: event.target.value,
                                  }))
                                }
                                placeholder={t("age", "Age")}
                                onInput={() => clearMissingField("age")}
                                className={`w-full rounded-xl bg-white px-3.5 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                                  missingProfileFields.includes("age")
                                    ? "border border-red-400 focus:border-red-500 focus:ring-red-100"
                                    : "border border-slate-300 focus:border-[#22409a] focus:ring-[#22409a]/10"
                                }`}
                              />
                            ) : null}
                            {showGenderField ? (
                              <div className="relative z-20">
                                <select
                                  value={registerForm.gender}
                                  onChange={(event) => {
                                    const gender = event.target.value;
                                    clearMissingField("gender");
                                    setRegisterForm((prev) => ({
                                      ...prev,
                                      gender,
                                    }));
                                  }}
                                  className={`min-h-[44px] w-full cursor-pointer rounded-xl border bg-white px-3.5 py-3 text-slate-800 shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                                    missingProfileFields.includes("gender")
                                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                      : "border-slate-300 focus:border-[#22409a] focus:ring-[#22409a]/10"
                                  }`}
                                >
                                  <option value="">
                                    {t("selectGender", "Select Gender")}
                                  </option>
                                  <option value="MALE">{t("male", "Male")}</option>
                                  <option value="FEMALE">{t("female", "Female")}</option>
                                  <option value="OTHER">{t("other", "Other")}</option>
                                </select>
                              </div>
                            ) : null}
                      </div>
                    </div>
                    ) : null}
                    {showAddressField ? (
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                        {t("address", "Address")}
                      </p>
                      {!showAddressBuilder ? (
                        <div className="space-y-3">
                          <input
                            value={registerForm.address}
                            onChange={(event) =>
                              setRegisterForm((prev) => ({
                                ...prev,
                                address: event.target.value,
                              }))
                            }
                            onInput={() => clearMissingField("address")}
                            placeholder={t("address", "Address")}
                            className={`w-full rounded-xl bg-white px-3.5 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                              missingProfileFields.includes("address")
                                ? "border border-red-400 focus:border-red-500 focus:ring-red-100"
                                : "border border-slate-300 focus:border-[#22409a] focus:ring-[#22409a]/10"
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="relative">
                            <select
                              value={registerForm.state}
                              onChange={(event) => {
                                const state = event.target.value;
                                clearMissingField("state");
                                setRegisterForm((prev) => ({
                                  ...prev,
                                  state,
                                  district: "",
                                  subDistrict: "",
                                  village: "",
                                }));
                              }}
                              className={`${dropdownBaseClass} ${missingProfileFields.includes("state") ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                            >
                              <option value="">{t("selectState", "Select State")}</option>
                              {STATES.map((stateName) => (
                                <option key={stateName} value={stateName}>
                                  {stateName}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          </div>
                          <div className="relative">
                            <select
                              value={registerForm.district}
                              onChange={(event) => {
                                const district = event.target.value;
                                clearMissingField("district");
                                setRegisterForm((prev) => ({
                                  ...prev,
                                  district,
                                  subDistrict: "",
                                  village: "",
                                }));
                              }}
                              disabled={!registerForm.state || addressDataLoading}
                              className={`${dropdownBaseClass} ${missingProfileFields.includes("district") ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                            >
                              <option value="">
                                {addressDataLoading
                                  ? t("loading", "Loading...")
                                  : t("selectDistrict", "Select District")}
                              </option>
                              {districtOptions.map((districtName) => (
                                <option key={districtName} value={districtName}>
                                  {districtName}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          </div>
                          <div className="relative">
                            <select
                              value={registerForm.subDistrict}
                              onChange={(event) => {
                                const subDistrict = event.target.value;
                                clearMissingField("subDistrict");
                                setRegisterForm((prev) => ({
                                  ...prev,
                                  subDistrict,
                                  village: "",
                                }));
                              }}
                              disabled={!registerForm.district}
                              className={`${dropdownBaseClass} ${missingProfileFields.includes("subDistrict") ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                            >
                              <option value="">{t("selectSubDistrict", "Select Sub District")}</option>
                              {subDistrictOptions.map((subDistrictName) => (
                                <option key={subDistrictName} value={subDistrictName}>
                                  {subDistrictName}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          </div>
                          <div className="relative">
                            <select
                              value={registerForm.village}
                              onChange={(event) => {
                                const village = event.target.value;
                                clearMissingField("village");
                                setRegisterForm((prev) => ({
                                  ...prev,
                                  village,
                                }));
                              }}
                              disabled={!registerForm.subDistrict}
                              className={`${dropdownBaseClass} ${missingProfileFields.includes("village") ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                            >
                              <option value="">{t("selectVillage", "Select Village")}</option>
                              {villageOptions.map((villageName) => (
                                <option key={villageName} value={villageName}>
                                  {villageName}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          </div>
                          <input
                            value={registerForm.pinCode}
                            onChange={(event) =>
                              setRegisterForm((prev) => ({
                                ...prev,
                                pinCode: event.target.value.replace(/\D/g, "").slice(0, 6),
                              }))
                            }
                            inputMode="numeric"
                            placeholder={t("pinCode", "Pin Code")}
                            onInput={() => clearMissingField("pinCode")}
                            className={`w-full rounded-xl bg-white px-3.5 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                              missingProfileFields.includes("pinCode")
                                ? "border border-red-400 focus:border-red-500 focus:ring-red-100"
                                : "border border-slate-300 focus:border-[#22409a] focus:ring-[#22409a]/10"
                            }`}
                          />
                          <input
                            value={registerForm.additionalDetails}
                            onChange={(event) =>
                              setRegisterForm((prev) => ({
                                ...prev,
                                additionalDetails: event.target.value,
                              }))
                            }
                            placeholder={t("enterAdditionalDetails", "Enter additional details")}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-800 placeholder:text-slate-400 focus:border-[#22409a] focus:outline-none focus:ring-4 focus:ring-[#22409a]/10 sm:col-span-2"
                          />
                        </div>
                      )}
                      {showAddressBuilder && hasSavedAddress ? (
                        <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                          {registerForm.address}
                        </p>
                      ) : null}
                      {showAddressBuilder && fullStructuredAddress ? (
                        <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                          {fullStructuredAddress}
                        </p>
                      ) : null}
                    </div>
                    ) : null}
                    {shouldShowAllProfileFields ? (
                    <div className="space-y-2 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                        {t("profileMedia", "Profile Media")}
                      </p>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("profilePicture", "Profile Picture")}
                      </label>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#22409a]/30 bg-[#f8faff] px-3 py-3 text-sm font-semibold text-[#22409a] transition hover:bg-[#eef3ff]">
                        <Upload size={16} />
                        {t("uploadProfilePhoto", "Upload profile photo")}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleRegisterImageChange}
                          className="hidden"
                        />
                      </label>
                      {registerForm.profileImagePreview ? (
                        <img
                          src={registerForm.profileImagePreview}
                          alt={t("profilePicture", "Profile Picture")}
                          className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                        />
                      ) : null}
                    </div>
                    ) : null}
                    {showRoleField || showSkillsField ? (
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                        {t("workPreferences", "Work Preferences")}
                      </p>
                      {showRoleField ? (
                        <div className="relative">
                          <select
                            value={registerForm.role}
                            onChange={(event) => {
                              const role = event.target.value as RegisterRole;
                              clearMissingField("role");
                              setRegisterForm((prev) => ({
                                ...prev,
                                role,
                                skills: [],
                              }));
                            }}
                            className={`${dropdownBaseClass} ${missingProfileFields.includes("role") ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                          >
                            <option value="WORKER">{t("worker", "Worker")}</option>
                            <option value="MEDIATOR">{t("mediator", "Mediator")}</option>
                            <option value="EMPLOYER">{t("employer", "Employer")}</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        </div>
                      ) : null}
                      {(showSkillsField &&
                        (registerForm.role === "WORKER" ||
                        registerForm.role === "MEDIATOR")) && (
                        <div
                          className={`mt-3 rounded-xl ${
                            missingProfileFields.includes("skills")
                              ? "border border-red-300 p-2"
                              : ""
                          }`}
                        >
                          <p className="mb-2 text-sm font-medium text-gray-700">
                            {t("skills", "Skills")}
                          </p>
                          <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                            <div className="flex flex-wrap gap-2">
                              {REGISTER_SKILLS.map((skill) => {
                                const selected = registerForm.skills.some(
                                  (item) => item.skill === skill.value,
                                );
                                return (
                                  <button
                                    key={skill.value}
                                    type="button"
                                    onClick={() => toggleRegisterSkill(skill.value)}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                      selected
                                        ? "border-[#22409a] bg-[#22409a] text-white"
                                        : "border-slate-300 bg-white text-slate-700"
                                    }`}
                                  >
                                    {t(skill.label, skill.label)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    ) : null}
                    {showSkillsField && registerForm.role === "WORKER" && registerForm.skills.length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-600">
                          {t("pricePerDay", "Price/Day")}
                        </p>
                        {registerForm.skills.map((item) => (
                          <div
                            key={item.skill}
                            className="grid grid-cols-[1fr_120px] items-center gap-2"
                          >
                            <p className="truncate text-sm font-medium text-slate-700">
                              {t(item.skill, item.skill)}
                            </p>
                            <input
                              type="number"
                              min={1}
                              value={item.pricePerDay || ""}
                              onChange={(event) =>
                                updateRegisterSkillPrice(item.skill, event.target.value)
                              }
                              placeholder={t("pricePerDay", "Price/Day")}
                              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-[#22409a] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
                {authMessage ? (
                  <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
                    {authMessage}
                  </p>
                ) : null}
                {authError ? (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    {authError}
                  </p>
                ) : null}
                {authStep === "mobile" ? (
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={authLoading}
                    className="group w-full rounded-xl bg-gradient-to-r from-[#22409a] to-[#3154bf] px-4 py-3.5 font-semibold text-white shadow-[0_14px_26px_rgba(34,64,154,0.32)] transition hover:-translate-y-0.5 hover:from-[#1d3889] hover:to-[#2947a8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="inline-flex items-center gap-2">
                      {authLoading
                      ? t("sendingOtp", "Sending OTP...")
                      : t("login")}
                      {!authLoading ? <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /> : null}
                    </span>
                  </button>
                ) : authStep === "otp" ? (
                  <button
                    type="button"
                    onClick={() => void verifyOtp()}
                    disabled={authLoading}
                    className="group w-full rounded-xl bg-gradient-to-r from-[#22409a] to-[#3154bf] px-4 py-3.5 font-semibold text-white shadow-[0_14px_26px_rgba(34,64,154,0.32)] transition hover:-translate-y-0.5 hover:from-[#1d3889] hover:to-[#2947a8] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="inline-flex items-center gap-2">
                      {authLoading
                      ? t("verifyingOtp", "Verifying...")
                      : t("verifyOtpAndLogin", "Verify OTP & Login")}
                      {!authLoading ? <ArrowRight size={16} className="transition group-hover:translate-x-0.5" /> : null}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthStep("otp")}
                      className="w-1/3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                    >
                      {t("back", "Back")}
                    </button>
                    <button
                      type="button"
                      onClick={completeRegistration}
                      disabled={authLoading}
                      className="w-2/3 rounded-xl bg-gradient-to-r from-[#22409a] to-[#3154bf] px-4 py-3.5 font-semibold text-white shadow-[0_14px_26px_rgba(34,64,154,0.32)] transition hover:-translate-y-0.5 hover:from-[#1d3889] hover:to-[#2947a8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {authLoading
                        ? t("submitting", "Submitting...")
                        : t("completeProfileButton", "Complete Profile")}
                    </button>
                  </div>
                )}
              </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {registerToast ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            {registerToast}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {registerErrorToast ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 left-1/2 z-[95] -translate-x-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            {registerErrorToast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense
      fallback={
        <nav
          className="-mb-px sticky top-0 z-50 flex min-h-[72px] w-full items-center justify-between border-b-2 border-[#22409a] bg-[#22409a] px-6 py-4 lg:px-12"
          aria-hidden
        />
      }
    >
      <NavbarContent />
    </Suspense>
  );
}
