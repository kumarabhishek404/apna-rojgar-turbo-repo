import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/theme";
import { useSession } from "@/lib/session";
import { Banner, Field, PrimaryButton } from "@/components/ui";

export default function LoginScreen() {
  const { user, signIn } = useSession();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState<string | undefined>();
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Redirect href="/(tabs)/users" />;

  const submit = async () => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    if (step === "otp" && otp.trim().length < 4) {
      setError("Enter the OTP sent to this mobile.");
      return;
    }
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const result = await signIn(digits, step === "otp" ? otp.trim() : undefined, otpSessionId);
      if (result.next === "otp") {
        setOtpSessionId(result.otpSessionId);
        setStep("otp");
        setInfo("OTP sent. Only an admin account can continue.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Image source={require("../assets/logo.png")} style={styles.logo} />
          <Text style={styles.title}>Admin - Apna Rojgar</Text>
          <Text style={styles.subtitle}>Users, services, analytics, and error logs for admins.</Text>
          <View style={styles.card}>
            <Field
              label="Admin mobile"
              value={mobile}
              onChangeText={setMobile}
              placeholder="10-digit mobile"
              keyboardType="phone-pad"
            />
            {step === "otp" ? (
              <Field
                label="OTP"
                value={otp}
                onChangeText={setOtp}
                placeholder="6-digit code"
                keyboardType="number-pad"
              />
            ) : null}
            {error ? <Banner text={error} /> : null}
            {info ? <Banner text={info} tone="ok" /> : null}
            <PrimaryButton label={busy ? "Please wait…" : step === "otp" ? "Sign in" : "Send OTP"} onPress={submit} disabled={busy} />
            {step === "otp" ? (
              <PrimaryButton
                label="Use a different number"
                tone="ghost"
                onPress={() => {
                  setStep("mobile");
                  setOtp("");
                  setError("");
                  setInfo("");
                }}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 12 },
  logo: { width: 84, height: 84, alignSelf: "center", borderRadius: 20, backgroundColor: "#fff" },
  title: { color: "#fff", fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#dbe4ff", textAlign: "center", marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 18, gap: 14 },
});
