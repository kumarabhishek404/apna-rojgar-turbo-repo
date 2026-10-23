import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { colors } from "@/constants/theme";
import { useSession } from "@/lib/session";

export default function Index() {
  const { ready, user } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryDark }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/users" />;
}
