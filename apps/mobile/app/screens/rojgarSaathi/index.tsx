import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAtomValue } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";
import Atoms from "@/app/AtomStore";
import APP_CONTEXT from "@/app/context/locale";
import { t } from "@/utils/translationHelper";
import { loadSaathiSnapshot } from "@/ai/tools/saathiData";
import { buildSuggestions, userReplyForChip } from "@/ai/suggestions/suggestionEngine";
import type { SuggestionChip, SaathiSnapshot } from "@/ai/suggestions/suggestionTypes";
import { runRojgarAgent } from "@/ai/agent/rojgarAgent";
import type { ConversationSlots, SaathiChoice } from "@/ai/agent/agentContext";
import { speakSaathi, stopSpeaking } from "@/ai/voice/textToSpeech";
import { transcribeSpeech, stopTranscription } from "@/ai/voice/speechToText";
import { SaathiEvents, trackSaathi } from "@/ai/analytics/aiAnalytics";

const DISMISS_KEY = "rojgarSaathi.dismissedSuggestions";

type Bubble = {
  id: string;
  from: "user" | "saathi";
  text: string;
  result?: { id: string; title: string; subtitle: string; kind?: "worker" | "job" };
};

function firstName(name?: string) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

export default function RojgarSaathiScreen() {
  const { locale, role } = APP_CONTEXT.useApp();
  const userDetails = useAtomValue(Atoms.UserAtom);
  const [snapshot, setSnapshot] = useState<SaathiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [chips, setChips] = useState<SuggestionChip[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [slots, setSlots] = useState<ConversationSlots>({});
  const [choiceChips, setChoiceChips] = useState<SaathiChoice[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const name = firstName(userDetails?.name);

  const load = useCallback(async () => {
    setLoading(true);
    const net = await NetInfo.fetch();
    setOffline(net.isConnected === false);
    try {
      const dismissedRaw = await AsyncStorage.getItem(DISMISS_KEY);
      const dismissed: string[] = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      const snap = await loadSaathiSnapshot({
        user: userDetails,
        role: (role as any) || userDetails?.role || "WORKER",
        locale,
      });
      setSnapshot(snap);
      const next = buildSuggestions(snap, dismissed);
      setChips(next);
      trackSaathi(SaathiEvents.OPENED, { role: snap.role, language: locale });
      next.forEach((c) =>
        trackSaathi(SaathiEvents.SUGGESTION_SHOWN, {
          suggestion_id: c.id,
          role: snap.role,
          language: locale,
        }),
      );
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [userDetails, role, locale]);

  useEffect(() => {
    void load();
    return () => {
      stopSpeaking();
      void stopTranscription();
    };
  }, [load]);

  const pushBubble = (
    from: Bubble["from"],
    text: string,
    result?: Bubble["result"],
  ) => {
    setBubbles((prev) => [
      ...prev,
      { id: `${Date.now()}-${from}-${prev.length}`, from, text, result },
    ]);
  };

  const handleReply = useCallback(
    async (
      utterance: string,
      source: "voice" | "text" | "suggestion",
      forcedIntent?: Parameters<typeof runRojgarAgent>[0]["forcedIntent"],
      pickId?: string,
      encoded?: string,
    ) => {
      if (!utterance.trim() || !snapshot) return;
      setBusy(true);
      pushBubble("user", utterance.trim());
      setChoiceChips([]);
      setChips([]);
      try {
        const started = Date.now();
        const history = bubbles.slice(-6).map((b) => ({
          role: b.from,
          text: b.text,
        }));
        const reply = await runRojgarAgent({
          utterance: encoded || (pickId ? `__pick__:${pickId}` : utterance.trim()),
          snapshot,
          slots,
          source,
          forcedIntent: forcedIntent,
          history,
        });
        setSlots(reply.slots);
        setChoiceChips(reply.choices || []);
        if (reply.suggestions?.length) setChips(reply.suggestions);
        else if (reply.choices?.length) setChips([]);
        pushBubble("saathi", reply.text);
        if (reply.results?.length) {
          for (const row of reply.results) {
            pushBubble(
              "saathi",
              [row.title, row.subtitle].filter(Boolean).join(" — "),
              row,
            );
          }
        }
        speakSaathi(reply.text, locale);
        trackSaathi(
          reply.intent === "UNKNOWN"
            ? SaathiEvents.INTENT_FAILED
            : SaathiEvents.INTENT_DETECTED,
          {
            intent: reply.intent,
            role: snapshot.role,
            language: locale,
            response_time: Date.now() - started,
            source,
          },
        );
        if (
          reply.navigateTo &&
          source === "suggestion" &&
          reply.intent === "VIEW_PROFILE"
        ) {
          router.push(reply.navigateTo as any);
        }
      } catch {
        pushBubble("saathi", t("saathiNetworkError"));
      } finally {
        setBusy(false);
        requestAnimationFrame(() =>
          scrollRef.current?.scrollToEnd({ animated: true }),
        );
      }
    },
    [snapshot, slots, locale, bubbles],
  );

  const onChip = async (chip: SuggestionChip) => {
    trackSaathi(SaathiEvents.SUGGESTION_CLICKED, {
      suggestion_id: chip.id,
      role: snapshot?.role,
      language: locale,
    });
    const reply = userReplyForChip(chip);
    const text = t(reply.key, reply.params);
    await handleReply(text, "suggestion", chip.intent);
  };

  const onMic = async () => {
    if (listening || busy) return;
    trackSaathi(SaathiEvents.VOICE_STARTED, { language: locale, role });
    setListening(true);
    const result = await transcribeSpeech(locale);
    setListening(false);
    if (result.ok) {
      trackSaathi(SaathiEvents.VOICE_COMPLETED, { language: locale, success: true });
      await handleReply(result.text, "voice");
      return;
    }
    trackSaathi(SaathiEvents.VOICE_COMPLETED, {
      language: locale,
      success: false,
      reason: result.reason,
    });
    if (result.reason === "denied") {
      pushBubble("saathi", t("saathiMicDenied"));
    } else if (result.reason === "unavailable") {
      pushBubble("saathi", t("saathiTypeInstead"));
    } else {
      pushBubble("saathi", t("saathiSpeechUnclear"));
    }
  };

  const confirmChips = chips.filter(
    (c) => c.id === "confirm_yes" || c.id === "confirm_no",
  );
  const topicChips =
    confirmChips.length || choiceChips.length ? [] : chips;

  const greeting = useMemo(
    () => t("saathiNamasteName", { name: name || t("homeGreetingFallbackName") }),
    [name, locale],
  );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("back")}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <CustomText baseFont={18} fontWeight="700" color={Colors.white}>
          {t("saathiTitle")}
        </CustomText>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <CustomText
            baseFont={22}
            fontWeight="800"
            color={Colors.heading}
            textAlign="left"
            style={styles.greet}
          >
            {greeting}
          </CustomText>
          <CustomText
            baseFont={16}
            color={Colors.subHeading}
            textAlign="left"
            style={{ marginBottom: 16 }}
          >
            {t("saathiHelpLine")}
          </CustomText>

          {offline ? (
            <CustomText color={Colors.danger} textAlign="left" style={{ marginBottom: 12 }}>
              {t("saathiNetworkError")}
            </CustomText>
          ) : null}

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : null}

          {bubbles.map((b) => (
            <TouchableOpacity
              key={b.id}
              disabled={!b.result?.id || busy}
              onPress={() => {
                if (!b.result?.id) return;
                const spoken =
                  b.result.kind === "job"
                    ? t("saathiReplyApplyThis")
                    : t("saathiReplyBookThis");
                void handleReply(spoken, "text", undefined, b.result.id);
              }}
              style={[styles.bubble, b.from === "user" ? styles.userBubble : styles.botBubble]}
            >
              <CustomText
                baseFont={15}
                color={b.from === "user" ? Colors.white : Colors.text}
                textAlign="left"
              >
                {b.text}
              </CustomText>
              {b.result?.id &&
              (b.result.kind === "job" || String(role).toUpperCase() !== "MEDIATOR") ? (
                <CustomText
                  baseFont={12}
                  color={Colors.primary}
                  textAlign="left"
                  style={{ marginTop: 6 }}
                >
                  {b.result.kind === "job"
                    ? t("saathiTapToApplyShort")
                    : t("saathiTapToBookShort")}
                </CustomText>
              ) : null}
            </TouchableOpacity>
          ))}

          {!loading && !confirmChips.length && !choiceChips.length
            ? topicChips.map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={styles.chip}
                  onPress={() => void onChip(chip)}
                  accessibilityRole="button"
                >
                  <CustomText
                    baseFont={16}
                    fontWeight="700"
                    color={Colors.heading}
                    textAlign="left"
                  >
                    {chip.icon} {t(chip.titleKey, chip.titleParams)}
                  </CustomText>
                </TouchableOpacity>
              ))
            : null}

          {choiceChips.length ? (
            <View style={styles.choiceWrap}>
              {choiceChips.map((choice) => (
                <TouchableOpacity
                  key={`${choice.field}-${choice.value}`}
                  style={styles.choiceChip}
                  disabled={busy}
                  onPress={() =>
                    void handleReply(
                      choice.title,
                      "text",
                      undefined,
                      undefined,
                      `__choice__:${choice.field}:${choice.value}`,
                    )
                  }
                  accessibilityRole="button"
                >
                  <CustomText
                    baseFont={16}
                    fontWeight="700"
                    color={Colors.heading}
                    textAlign="center"
                  >
                    {typeof choice.title === "string"
                      ? choice.title
                      : String((choice as any).title?.singular || choice.value)}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {confirmChips.length ? (
            <View style={styles.confirmRow}>
              {confirmChips.map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.confirmChip,
                    chip.id === "confirm_yes" ? styles.confirmYes : styles.confirmNo,
                  ]}
                  onPress={() => void onChip(chip)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={t(chip.titleKey)}
                >
                  <CustomText
                    baseFont={16}
                    fontWeight="700"
                    color={chip.id === "confirm_yes" ? Colors.white : Colors.heading}
                  >
                    {chip.icon} {t(chip.titleKey)}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <TouchableOpacity
            style={[styles.mic, listening && styles.micLive]}
            onPress={() => void onMic()}
            accessibilityRole="button"
            accessibilityLabel={t("saathiSpeakPrompt")}
          >
            <Ionicons name={listening ? "mic" : "mic-outline"} size={36} color={Colors.white} />
          </TouchableOpacity>
          <CustomText baseFont={13} color={Colors.subHeading} style={{ marginTop: 6 }}>
            {listening ? t("saathiListening") : t("saathiSpeakPrompt")}
          </CustomText>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t("saathiTypePlaceholder")}
              placeholderTextColor={Colors.inputPlaceholder}
              style={styles.input}
              editable={!busy}
              onSubmitEditing={() => {
                const text = draft;
                setDraft("");
                void handleReply(text, "text");
              }}
            />
            <TouchableOpacity
              onPress={() => {
                const text = draft;
                setDraft("");
                void handleReply(text, "text");
              }}
              disabled={busy || !draft.trim()}
              style={styles.send}
            >
              <Ionicons name="send" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  body: { padding: 16, paddingBottom: 24 },
  greet: { marginBottom: 6 },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDE6F5",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    minHeight: 52,
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "92%",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#E6ECF7",
  },
  composer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E6ECF7",
  },
  mic: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  micLive: { backgroundColor: Colors.danger },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.text,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  confirmChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  confirmYes: {
    backgroundColor: Colors.primary,
  },
  confirmNo: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#DDE6F5",
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  choiceChip: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: "#22409a",
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    minWidth: 96,
    justifyContent: "center",
  },
});
