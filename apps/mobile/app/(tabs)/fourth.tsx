import React from "react";
import { useAtomValue } from "jotai";
import Atoms from "../AtomStore";
import AdminRequests from "../screens/bottomTabs/(admin)/requests";
import UnifiedActivityScreen from "../screens/unified/UnifiedActivityScreen";

export default function ActivityTabScreen() {
  const userDetails = useAtomValue(Atoms?.UserAtom);

  if (userDetails?.isAdmin) return <AdminRequests />;
  return <UnifiedActivityScreen />;
}
