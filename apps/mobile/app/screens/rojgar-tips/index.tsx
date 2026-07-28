import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "@/components/commons/Header";
import CustomText from "@/components/commons/CustomText";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";
import {
  ROJGAR_TIPS_HOSTS,
  rojgarTipsArticleUrl,
  rojgarTipsListUrl,
  withInAppParam,
} from "@/utils/rojgarTipsLinks";

/**
 * In-app reader for website Rojgar Tips (single content source).
 * Optional `slug` opens an article; otherwise the tips list.
 */
const RojgarTipsScreen = () => {
  const params = useLocalSearchParams<{ slug?: string; url?: string }>();
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const initialUrl = useMemo(() => {
    const slug = typeof params.slug === "string" ? params.slug.trim() : "";
    if (slug) return rojgarTipsArticleUrl(slug, true);

    const rawUrl = typeof params.url === "string" ? params.url.trim() : "";
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        if (ROJGAR_TIPS_HOSTS.has(parsed.hostname.toLowerCase())) {
          return withInAppParam(parsed.toString());
        }
      } catch {
        // fall through to list
      }
    }
    return rojgarTipsListUrl(true);
  }, [params.slug, params.url]);

  const onFindJobs = useCallback(() => {
    router.push("/(tabs)/second");
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              title="rojgarTips"
              left="back"
              right="notification"
            />
          ),
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : null}

        <WebView
          ref={webRef}
          source={{ uri: initialUrl }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
          startInLoadingState
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={`
            window.isApnaRojgarApp = true;
            true;
          `}
          onShouldStartLoadWithRequest={(request) => {
            try {
              const host = new URL(request.url).hostname.toLowerCase();
              if (
                host === "localhost" ||
                ROJGAR_TIPS_HOSTS.has(host) ||
                host.endsWith(".apnarojgarindia.com")
              ) {
                return true;
              }
            } catch {
              return false;
            }
            return false;
          }}
        />

        <View style={styles.footer}>
          {canGoBack ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => webRef.current?.goBack()}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={18} color={Colors.primary} />
              <CustomText color={Colors.primary} fontWeight="700" baseFont={13}>
                {t("back")}
              </CustomText>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onFindJobs}
            accessibilityRole="button"
          >
            <Ionicons name="briefcase-outline" size={18} color={Colors.white} />
            <CustomText color={Colors.white} fontWeight="700" baseFont={14}>
              {t("findSimilarJobs")}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default RojgarTipsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fourth,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(14,79,197,0.12)",
    backgroundColor: Colors.white,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
});
