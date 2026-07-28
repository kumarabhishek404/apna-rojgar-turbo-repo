import { useRouter } from "expo-router";
import { useLayoutEffect } from "react";

export default function RojgarTipsListBridge() {
  const router = useRouter();

  useLayoutEffect(() => {
    router.replace("/screens/rojgar-tips");
  }, [router]);

  return null;
}
