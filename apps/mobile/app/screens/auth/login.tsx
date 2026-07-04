import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAtom } from "jotai";
import { useMutation } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import USER from "@/app/api/user";
import { useForm, Controller } from "react-hook-form";
import TextInputComponent from "@/components/inputs/TextInputWithIcon";
import CustomHeading from "@/components/commons/CustomHeading";
import Button from "@/components/inputs/Button";
import CustomText from "@/components/commons/CustomText";
import { useTranslation } from "@/utils/i18n";
import PUSH_NOTIFICATION from "@/app/hooks/usePushNotification";
import AUTH from "@/app/api/auth";
import REFRESH_USER from "@/app/hooks/useRefreshUser";
import { saveToken } from "@/utils/authStorage";
import Loader from "@/components/commons/Loaders/Loader";
import StickButtonWithWall from "@/components/commons/StickButtonWithWall";
import APP_CONTEXT from "@/app/context/locale";
import MobileNumberField from "@/components/inputs/MobileNumber";
import ContactSupport from "@/components/commons/ContactSupport";
import {
  DEV_OTP_PLACEHOLDER,
  shouldSkipOtpClient,
} from "@/utils/devOtp";

export default function Login() {
  APP_CONTEXT?.useApp();
  const { t } = useTranslation();
  const { refreshUser } = REFRESH_USER.useRefreshUser();
  const [userDetails, setUserDetails] = useAtom(Atoms.UserAtom);
  const [countryCode, setCountryCode] = useState<string>("+91");

  const [step, setStep] = useState<1 | 2>(1);
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { mobile } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(30);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      mobile: mobile || "",
      otp: "",
    },
  });

  useEffect(() => {
    if (step === 2) {
      startResendTimer();
    }

    // Optional cleanup if user leaves the screen
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [step]);

  const startResendTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setResendDisabled(true);
    setTimer(30);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* -------------------- STEP 1: SEND OTP -------------------- */
  const sendOtpMutation = useMutation({
    mutationFn: (payload: { mobile: string }) => AUTH.signIn(payload),
    onSuccess: (data: { otpSessionId?: string }) => {
      setLoginError(null);
      setOtpSessionId(
        typeof data?.otpSessionId === "string" && data.otpSessionId.trim()
          ? data.otpSessionId.trim()
          : null,
      );
      setStep(2);
    },
    onError: (err: any) => {
      setLoginError(err?.response?.data?.message || "Failed to send OTP");
    },
  });

  /* -------------------- STEP 2: VERIFY OTP -------------------- */
  const verifyOtpMutation = useMutation({
    mutationFn: (payload: {
      mobile: string;
      otp: string;
      otpSessionId?: string;
    }) => AUTH.signIn(payload),

    onSuccess: async (response) => {
      const { token, user } = response;

      await saveToken(token);

      // 1️⃣ Account not active
      // if (user?.status !== "ACTIVE") {
      //   router.replace("/(tabs)/fifth");
      //   return;
      // }

      // 2️⃣ Incomplete onboarding
      if (!user?.name || !user?.address || !user?.gender || !user?.age) {
        setUserDetails(user);
        router.push({
          pathname: "/screens/auth/register/second",
          params: { userId: user._id },
        });
        return;
      }

      // if (!user.profilePicture) {
      //   setUserDetails(user);
      //   router.push({
      //     pathname: "/screens/auth/register/fifth",
      //     params: { userId: user._id },
      //   });
      //   return;
      // }

      // 3️⃣ Navigate immediately 🚀
      setUserDetails({ isAuth: true, ...user });
      router.replace("/(tabs)");

      // 4️⃣ Fire-and-forget background tasks 🔄
      Promise.allSettled([
        PUSH_NOTIFICATION.registerForPushNotificationsAsync(
          user.notificationConsent,
          user._id,
        ),
        refreshUser().then((updatedUser) =>
          setUserDetails({ isAuth: true, ...updatedUser }),
        ),
      ]);
    },

    onError: async (err: any) => {
      setLoading(false);
      const errorMessage = err?.response?.data?.message;
      setLoginError(errorMessage || "Login failed");
    },
  });

  /* -------------------- HANDLERS -------------------- */
  const handleLoginPress = (data: any) => {
    if (shouldSkipOtpClient()) {
      verifyOtpMutation.mutate({
        mobile: data.mobile,
        otp: DEV_OTP_PLACEHOLDER,
      });
      return;
    }
    if (step === 1) {
      sendOtpMutation.mutate({ mobile: data.mobile });
    } else {
      verifyOtpMutation.mutate({
        mobile: data.mobile,
        otp: data.otp,
        ...(otpSessionId ? { otpSessionId } : {}),
      });
    }
  };

  const handleNewRegistration = () => {
    router.replace("/screens/auth/register/first"); // Use replace
    setUserDetails(null);
  };

  /* -------------------- UI -------------------- */
  return (
    <>
      <Loader
        loading={sendOtpMutation.isPending || verifyOtpMutation.isPending}
      />
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screenWrapper}>
            <View pointerEvents="none" style={styles.decorCircleTop} />
            <View pointerEvents="none" style={styles.decorCircleBottom} />

            <View style={styles.authHeader}>
              <View style={styles.brandMark}>
                <View style={styles.brandMarkInner}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={36}
                    color={Colors.primary}
                  />
                </View>
              </View>
              <CustomHeading
                baseFont={28}
                color={Colors.white}
                style={styles.title}
              >
                अपना रोजगार में आपका स्वागत है
              </CustomHeading>
              <CustomText
                baseFont={14}
                color="rgba(255, 255, 255, 0.76)"
                textAlign="center"
                style={styles.subtitle}
              >
                {step === 1
                  ? t("verificationDescription1")
                  : t("verificationDescription2")}
              </CustomText>
            </View>

            <View style={styles.authCard}>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepPill,
                    step === 1 ? styles.stepPillActive : styles.stepPillDone,
                  ]}
                >
                  <CustomText
                    baseFont={12}
                    fontWeight="800"
                    color={step === 1 ? Colors.white : Colors.primary}
                  >
                    1
                  </CustomText>
                </View>
                <View style={styles.stepLine} />
                <View
                  style={[
                    styles.stepPill,
                    step === 2 && styles.stepPillActive,
                  ]}
                >
                  <CustomText
                    baseFont={12}
                    fontWeight="800"
                    color={step === 2 ? Colors.white : Colors.primary}
                  >
                    2
                  </CustomText>
                </View>
              </View>

              <View style={styles.formContainer}>
                {/* MOBILE INPUT */}
                <Controller
                  control={control}
                  name="mobile"
                  rules={{
                    required: t("mobileIsRequired"),
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: t("enterAValidMobileNumber"),
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <MobileNumberField
                      name="mobile"
                      countryCode={countryCode}
                      setCountryCode={setCountryCode}
                      mobile={value as string}
                      setPhoneNumber={onChange}
                      errors={errors}
                      placeholder={t("enterMobileTitle")}
                      testID="login-mobile-input"
                      inputStyle={styles.authInputContainer}
                      textStyles={styles.authInputText}
                      icon={
                        <View style={styles.fieldIconBadge}>
                          <Feather
                            name="phone"
                            size={18}
                            color={Colors.primary}
                          />
                        </View>
                      }
                    />
                    // <TextInputComponent
                    //   label="mobile"
                    //   name="mobile"
                    //   value={value as string}
                    //   type="number"
                    //   maxLength={10}
                    //   onChangeText={onChange}
                    //   placeholder={t("enterYourMobile")}
                    //   errors={errors}
                    //   textStyles={{ marginLeft: 10 }}
                    //   icon={
                    //     <Ionicons
                    //       name="call-outline"
                    //       size={25}
                    //       color={Colors.secondary}
                    //     />
                    //   }
                    // />
                  )}
                />

                {/* OTP INPUT (STEP 2 ONLY) */}
                {step === 2 && (
                  <Controller
                    control={control}
                    name="otp"
                    rules={{
                      required: t("otpIsRequired"),
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: t("enterAValidOtp"),
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <TextInputComponent
                        label="otp"
                        name="otp"
                        value={value as string}
                        type="number"
                        maxLength={6}
                        onChangeText={onChange}
                        placeholder={t("enterYourOtp")}
                        testID="login-otp-input"
                        errors={errors}
                        inputStyle={styles.otpInputContainer}
                        textStyles={styles.otpInputText}
                        icon={
                          <View style={styles.fieldIconBadge}>
                            <Ionicons
                              name="keypad-outline"
                              size={18}
                              color={Colors.primary}
                            />
                          </View>
                        }
                      />
                    )}
                  />
                )}

                {step === 2 && (
                  <TouchableOpacity
                    onPress={() =>
                      sendOtpMutation.mutate({
                        mobile: watch("mobile") as string,
                      })
                    }
                    disabled={resendDisabled}
                  >
                    <CustomText
                      color={resendDisabled ? Colors.primary : Colors.danger}
                      baseFont={14}
                      fontWeight="700"
                      textAlign="right"
                    >
                      {resendDisabled
                        ? `${t("resendOtpIn", { seconds: timer })}`
                        : t("resendOtp")}
                    </CustomText>
                  </TouchableOpacity>
                )}

                {loginError && (
                  <CustomText color={Colors.error} style={styles.errorText}>
                    {loginError}
                  </CustomText>
                )}

                <Button
                  isPrimary
                  testID="login-submit-button"
                  title={
                    shouldSkipOtpClient()
                      ? t("login")
                      : step === 1
                        ? t("sendOtp")
                        : t("login")
                  }
                  onPress={handleSubmit(handleLoginPress)}
                  style={styles.loginButtonWrapper}
                  textStyle={{ fontSize: 20, fontWeight: "800" }}
                  disabled={loading} // Disable button when loading
                />

                {/* Registration entry remains intentionally hidden to preserve the existing auth flow. */}
              </View>
            </View>
            <View style={styles.supportSlot}>
              <ContactSupport />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StickButtonWithWall
        content={
          <View style={{ paddingHorizontal: 4 }}>
            <CustomText fontWeight="bold" baseFont={16} color={Colors.primary}>
              {t("changeLanguage")}
            </CustomText>
          </View>
        }
        onPress={() =>
          router.push({
            pathname: "/screens/settings/changeLanguage",
            params: { title: "notifications", type: "all" },
          })
        }
        position="top"
        containerStyles={styles.languageButton}
      />
    </>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  /* Scroll takes full screen height */
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: Colors.primary,
  },

  /* Full screen wrapper */
  screenWrapper: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 90,
    paddingBottom: 28,
    justifyContent: "flex-start",
    backgroundColor: Colors.primary,
    overflow: "hidden",
  },

  authHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  decorCircleTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -118,
    left: -96,
  },
  decorCircleBottom: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    right: -96,
    bottom: 110,
  },
  brandMark: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
  },
  brandMarkInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 6,
    lineHeight: 21,
    paddingHorizontal: 18,
  },
  authCard: {
    backgroundColor: Colors.white,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 30,
    minHeight: 280,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#061844",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    marginTop: 2,
  },
  supportSlot: {
    marginTop: "auto",
    paddingTop: 32,
  },
  languageButton: {
    height: 40,
    backgroundColor: Colors.white,
    shadowColor: "#061844",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  stepPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.18)",
  },
  stepPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepPillDone: {
    backgroundColor: "#EAF8F0",
    borderColor: "#BFE8CE",
  },
  stepLine: {
    width: 54,
    height: 2,
    backgroundColor: "#DDE6F5",
    marginHorizontal: 8,
  },

  formContainer: {
    gap: 18,
  },
  fieldIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },
  authInputContainer: {
    height: 64,
    borderRadius: 18,
    borderColor: "#DDE6F5",
    backgroundColor: "#F8FAFF",
    paddingLeft: 12,
  },
  authInputText: {
    color: Colors.heading,
    fontWeight: "700",
  },

  errorText: {
    textAlign: "center",
    backgroundColor: "#FEEEEE",
    borderRadius: 12,
    padding: 10,
  },

  loginButtonWrapper: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  otpInputContainer: {
    borderRadius: 16,
  },
  otpInputText: {
    marginLeft: 10,
    fontSize: 20,
    letterSpacing: 5,
    fontWeight: "700",
  },

  container: {
    flexGrow: 1,
    backgroundColor: Colors.fourth,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  // formContainer: {
  //   marginTop: 20,
  //   gap: 15,
  // },
  otpInput: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 6,
    textAlign: "center",
    fontSize: 20,
    backgroundColor: Colors.white,
  },
  loginButton: {
    height: 53,
    borderRadius: 8,
  },
  // errorText: {
  //   textAlign: "center",
  // },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  // loginButtonWrapper: {
  //   backgroundColor: Colors.primary,
  //   borderRadius: 8,
  //   height: 53,
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
});
