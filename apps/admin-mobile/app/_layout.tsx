import "react-native-gesture-handler";
import { useEffect, type ReactNode } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { SessionProvider, useSession } from "@/lib/session";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function SplashGate({ children }: { children: ReactNode }) {
  const { ready } = useSession();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);
  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <SplashGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="user/[id]" />
              <Stack.Screen name="service/[id]" />
            </Stack>
          </SplashGate>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
