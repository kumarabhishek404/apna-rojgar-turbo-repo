import React from "react";
import { useAtomValue } from "jotai";
import Atoms from "../AtomStore";
import AdminServices from "../screens/bottomTabs/(admin)/services";
import UnifiedWorkScreen from "../screens/unified/UnifiedWorkScreen";

export default function WorkTabScreen() {
  const userDetails = useAtomValue(Atoms.UserAtom);

  if (userDetails?.isAdmin) return <AdminServices />;
  return <UnifiedWorkScreen />;
}
