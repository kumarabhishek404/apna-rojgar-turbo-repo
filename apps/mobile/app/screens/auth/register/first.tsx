import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import Button from "@/components/inputs/Button";
import CustomHeading from "@/components/commons/CustomHeading";
import MobileNumberField from "@/components/inputs/MobileNumber";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import TOAST from "@/app/hooks/toast";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import AUTH from "@/app/api/auth";
import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Atoms from "@/app/AtomStore";
import Loader from "@/components/commons/Loaders/Loader";
import { saveToken } from "@/utils/authStorage";
import StickButtonWithWall from "@/components/commons/StickButtonWithWall";
import {
  DEV_OTP_PLACEHOLDER,
  shouldSkipOtpClient,
} from "@/utils/devOtp";

interface FormData {
  mobile: string;
}

// Same import section...

const RegisterScreen: React.FC = () => {
  const [userDetails, setUserDetails] = useAtom(Atoms?.UserAtom);
  const locale = useAtomValue(Atoms?.LocaleAtom);
  const { userId } = useLocalSearchParams();

  const [step, setStep] = useState<number>(1);
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [otp, setOtp] = useState<string>("");
  const [mobileNumberExist, setMobileNumberExist] = useState<string>("notSet");
  const [timer, setTimer] = useState<number>(30);
  const [resendDisabled, setResendDisabled] = useState<boolean>(true);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [nextStepAfterOtp, setNextStepAfterOtp] = useState<{
    route: string;
    params: any;
  } | null>(null);
  const [userCanResumeRegistration, setUserCanResumeRegistration] =
    useState(false);

  const {
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    defaultValues: { mobile: "" },
    mode: "onChange",
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

  useEffect(() => {
    if (nextStepAfterOtp) {
      router.push({
        pathname: nextStepAfterOtp.route as any,
        params: nextStepAfterOtp.params,
      });
    }
  }, [nextStepAfterOtp]);

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

  const mutationRegister = useMutation({
    mutationKey: ["register"],
    mutationFn: (payload) => AUTH.register(payload),
    onSuccess: async (data) => {
      // TOAST?.success(t("userAddedSuccessfully"));

      // Save token and update user state first
      await Promise.all([
        saveToken(data?.data?.token),
        setUserDetails({
          ...userDetails,
          _id: data?.data?.userId,
        }), // Ensure user ID is set
      ]);

      router.push({
        pathname: "/screens/auth/register/second",
        params: { userId: userId || data?.data?.userId },
      });
    },
    onError: (err) => {
      console.log("Failed while registering the new user", err);
    },
  });

  const checkMobileNumber = useMutation({
    mutationFn: async (payload: { mobile: string }) =>
      AUTH.checkMobileExistance(payload),

    onSuccess: async ({ data }) => {
      const exists = data?.data?.exists;
      const token = data?.data?.token;
      const user = data?.data?.user;

      if (!token || !user) {
        setUserCanResumeRegistration(false);
        return;
      }

      // ✅ Securely store token
      await saveToken(token);

      console.log("user--", user);

      // ✅ Store user in app state
      setUserDetails({ ...user });

      setMobileNumberExist(exists ? "exist" : "notExist");

      const { name, gender, address, age, profilePicture, _id } = user;

      const isEmpty = (val: any) =>
        val === undefined || val === null || String(val).trim() === "";

      const missingBasics =
        isEmpty(name) || isEmpty(gender) || isEmpty(address) || isEmpty(age);

      let route: string = "";
      if (missingBasics) route = "/screens/auth/register/second";
      // else if (isEmpty(password)) route = "/screens/auth/register/third";
      else if (isEmpty(profilePicture)) route = "/screens/auth/register/fifth";
      else route = "/screens/auth/login";

      if (!missingBasics && !isEmpty(profilePicture))
        TOAST.error(t("userAlreadyExist"));
      // ✅ Always set next step based on data presence, regardless of in-memory token
      setUserCanResumeRegistration(true);
      setNextStepAfterOtp({
        route,
        params:
          route === "/screens/auth/login"
            ? { mobile: user.mobile }
            : { userId: _id },
      });

      // setStep(1);
    },

    onError: () => TOAST.error(t("errorCheckingMobile")),
  });

  const sendOtp = useMutation({
    mutationFn: async (mobile: string) => AUTH.sendOTP(mobile),
    onSuccess: (data: { Status?: string; success?: boolean; otpSessionId?: string }) => {
      console.log("sendOtp response---", data);

      if (data?.Status === "Success" || data?.success === true) {
        setOtpSessionId(
          typeof data?.otpSessionId === "string" && data.otpSessionId.trim()
            ? data.otpSessionId.trim()
            : null,
        );
        setStep(2);
        startResendTimer();
        TOAST.success(t("otpSentSuccess"));
      } else {
        TOAST.error(t("otpSentFail"));
      }
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async (payload: {
      mobile: string;
      otp: string;
      otpSessionId?: string;
    }) => AUTH.verifyOTP(payload),
    onSuccess: ({ Status }) => {
      if (Status === "Success") {
        TOAST.success(t("otpVerified"));
        // Reset step to initial state
        // setStep(1);

        // Otherwise, treat this as a fresh registration
        const payload: any = {
          countryCode: countryCode,
          mobile: watch("mobile"),
          locale: locale,
        };
        mutationRegister.mutate(payload);
        // Reset OTP input
        setOtp("");
      } else {
        TOAST.error(t("otpInvalidMessage"));
      }
    },
  });

  // console.log("checkMobileNumber?.isPending---", checkMobileNumber?.isPending);
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Loader
            loading={
              mutationRegister?.isPending ||
              sendOtp?.isPending ||
              verifyOtp?.isPending ||
              checkMobileNumber?.isPending
            }
          />
          <View style={styles.heroSection}>
            <View style={styles.heroIconWrap}>
              <AntDesign name="mobile1" size={70} color={Colors.primary} />
            </View>
            <CustomHeading
              baseFont={26}
              color={Colors.primary}
              style={styles.title}
            >
              {t("verificationTitle")}
            </CustomHeading>
            <CustomText
              baseFont={15}
              color={Colors.secondary}
              textAlign="center"
              style={styles.subtitle}
            >
              {step === 1
                ? t("verificationDescription1")
                : t("verificationDescription2")}
            </CustomText>
          </View>

          <View style={styles.formCard}>
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
                style={[styles.stepPill, step === 2 && styles.stepPillActive]}
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
            {step === 1 && (
              <>
                <Controller
                  control={control}
                  name="mobile"
                  rules={{
                    required: t("mobileRequired"),
                    pattern: {
                      value: /^\d{10}$/,
                      message: t("mobileInvalid"),
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <MobileNumberField
                      name="mobile"
                      countryCode={countryCode}
                      setCountryCode={setCountryCode}
                      mobile={value}
                      setPhoneNumber={(val: string) => {
                        setMobileNumberExist("notSet");
                        onChange(val);
                        if (val.length === 10)
                          checkMobileNumber.mutate({ mobile: val });
                      }}
                      errors={errors}
                      loading={checkMobileNumber?.isPending}
                      isMobileNumberExist={mobileNumberExist === "exist"}
                      placeholder={t("enterMobileTitle")}
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
                  )}
                />
                <Button
                  isPrimary
                  title={
                    shouldSkipOtpClient()
                      ? t("nextContinue")
                      : t("sendOtp")
                  }
                  onPress={() => {
                    const fullMobile = `${countryCode}${watch("mobile")}`;
                    if (shouldSkipOtpClient()) {
                      verifyOtp.mutate({
                        mobile: fullMobile,
                        otp: DEV_OTP_PLACEHOLDER,
                      });
                    } else {
                      sendOtp.mutate(fullMobile);
                    }
                  }}
                  style={styles.button}
                  disabled={
                    checkMobileNumber?.isPending ||
                    !isValid ||
                    (mobileNumberExist === "exist" &&
                      !userCanResumeRegistration)
                  }
                  textStyle={{ fontSize: 20, fontWeight: "800" }}
                />
              </>
            )}

            {step === 2 && (
              <View style={styles.otpContainer}>
                <View style={styles.mobileNumberView}>
                  <View style={styles.selectedMobile}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={Colors.primary}
                    />
                    <CustomText
                      baseFont={15}
                      color={Colors.primary}
                      fontWeight="700"
                    >
                      {countryCode} {watch("mobile")}
                    </CustomText>
                  </View>
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    style={styles.editButton}
                  >
                    <Feather name="edit-2" size={16} color={Colors.primary} />
                    <CustomText
                      baseFont={12}
                      color={Colors.primary}
                      fontWeight="700"
                    >
                      {t("edit")}
                    </CustomText>
                  </TouchableOpacity>
                </View>
                <View style={styles.otpLableContainer}>
                  <CustomHeading
                    textAlign="left"
                    baseFont={16}
                    color={Colors.inputLabel}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {t("otpTitle")}
                  </CustomHeading>
                  <TouchableOpacity
                    onPress={() =>
                      sendOtp.mutate(`${countryCode}${watch("mobile")}`)
                    }
                    disabled={resendDisabled}
                  >
                    <CustomText
                      color={resendDisabled ? Colors.text : Colors.primary}
                      baseFont={14}
                      fontWeight="700"
                    >
                      {resendDisabled
                        ? `${t("resendOtpIn", { seconds: timer })}`
                        : t("resendOtp")}
                    </CustomText>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="••••••"
                  placeholderTextColor="#B8C1D4"
                />
                <CustomText
                  baseFont={14}
                  color="#F97316"
                  textAlign="center"
                  style={styles.voiceHint}
                >
                  {t("voiceCallMayBeCome")}
                </CustomText>
                <Button
                  isPrimary
                  title={t("verifyOtp")}
                  onPress={() =>
                    verifyOtp.mutate({
                      mobile: `${countryCode}${watch("mobile")}`,
                      otp,
                      ...(otpSessionId ? { otpSessionId } : {}),
                    })
                  }
                  style={styles.button}
                  disabled={otp.length !== 6}
                  textStyle={{ fontSize: 20, fontWeight: "800" }}
                />
              </View>
            )}

            <View style={styles.footerContainer}>
              <CustomText>{t("alreadyHaveAnAccount")}</CustomText>
              <TouchableOpacity
                onPress={() => router.replace("/screens/auth/login")}
              >
                <CustomHeading baseFont={24} color={Colors.tertieryButton}>
                  {t("signIn")}
                </CustomHeading>
              </TouchableOpacity>
            </View>
            {(sendOtp?.isPending || verifyOtp?.isPending) && (
              <ActivityIndicator size="large" color={Colors.primary} />
            )}
            </View>
          </View>
        </ScrollView>
        <StickButtonWithWall
          content={
            <View style={{ paddingHorizontal: 4 }}>
              <CustomText fontWeight="bold" baseFont={16} color={Colors?.white}>
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
          containerStyles={{ height: 40 }}
        />
      </KeyboardAvoidingView>
    </>
  );
};

// Style remains unchanged...

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.fourth,
    paddingHorizontal: 18,
    paddingTop: 86,
    paddingBottom: 26,
    justifyContent: "center",
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 22,
  },
  heroIconWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.12)",
  },
  title: {
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  formCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4EAF5",
    shadowColor: "#0F2E6E",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
  centeredView: {
    alignItems: "center",
    marginBottom: 20,
  },
  formContainer: {
    gap: 16,
    width: "100%",
    alignItems: "center",
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
    height: 58,
    borderRadius: 16,
    borderColor: "#DDE6F5",
    backgroundColor: "#F8FAFF",
    paddingLeft: 12,
  },
  authInputText: {
    color: Colors.heading,
    fontWeight: "700",
  },
  button: {
    height: 56,
    borderRadius: 16,
    width: "100%",
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  otpContainer: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  otpInput: {
    width: "100%",
    textAlign: "center",
    height: 58,
    borderWidth: 1.5,
    borderColor: "#DDE6F5",
    borderRadius: 16,
    fontSize: 22,
    letterSpacing: 10,
    fontWeight: "800",
    color: Colors.primary,
    backgroundColor: "#F8FAFF",
  },
  image: { width: 150, height: 150, marginBottom: 20 },
  mobileNumberView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
  },
  selectedMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.white,
  },
  otpLableContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  voiceHint: {
    lineHeight: 20,
    backgroundColor: "#FFF7E8",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
});
