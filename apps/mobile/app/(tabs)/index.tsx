import React from "react";
import { useAtomValue } from "jotai";
import AdminUsers from "../screens/bottomTabs/(admin)/users";
import Atoms from "../AtomStore";
import UnifiedHomeDashboard from "../screens/unified/UnifiedHomeDashboard";

export default function HomeTabScreen() {
  const userDetails = useAtomValue(Atoms?.UserAtom);

  if (userDetails?.isAdmin) return <AdminUsers />;
  return <UnifiedHomeDashboard />;
}
