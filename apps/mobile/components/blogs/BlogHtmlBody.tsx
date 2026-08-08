import React, { useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { WebView } from "react-native-webview";
import CustomText from "@/components/commons/CustomText";
import Colors from "@/constants/Colors";

type Props = {
  content: string;
};

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

/**
 * Renders blog HTML (or plain text paragraphs) inside an auto-height WebView.
 */
const BlogHtmlBody = ({ content }: Props) => {
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(220);

  const htmlSource = useMemo(() => {
    const raw = String(content || "").trim();
    if (!raw) return null;
    if (!looksLikeHtml(raw)) {
      const escaped = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const paragraphs = escaped
        .split(/\n{2,}/)
        .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");
      return wrapHtml(paragraphs);
    }
    return wrapHtml(raw);
  }, [content]);

  if (!htmlSource) {
    return (
      <CustomText color={Colors.subHeading} textAlign="left">
        —
      </CustomText>
    );
  }

  return (
    <View style={[styles.wrap, { minHeight: height }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlSource }}
        style={{ width: width - 32, height, backgroundColor: "transparent" }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        onMessage={(event) => {
          const next = Number(event.nativeEvent.data);
          if (Number.isFinite(next) && next > 40) {
            setHeight(Math.ceil(next) + 8);
          }
        }}
        injectedJavaScript={`
          (function() {
            function post() {
              var h = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
              );
              window.ReactNativeWebView.postMessage(String(h));
            }
            post();
            setTimeout(post, 200);
            setTimeout(post, 800);
            true;
          })();
        `}
      />
    </View>
  );
};

function wrapHtml(body: string) {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 16px; line-height: 1.65; color: #334155; background: transparent; }
  h1,h2,h3,h4 { color: #16264f; line-height: 1.3; }
  img { max-width: 100%; height: auto; border-radius: 10px; }
  a { color: #22409a; }
  p { margin: 0 0 14px; }
  ul,ol { padding-left: 20px; }
</style></head><body>${body}</body></html>`;
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
  },
});

export default BlogHtmlBody;
