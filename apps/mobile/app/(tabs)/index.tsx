import React from "react";
import { useAtomValue } from "jotai";
import Atoms from "../AtomStore";
import UnifiedHomeDashboard from "../screens/unified/UnifiedHomeDashboard";

export default function HomeTabScreen() {
  useAtomValue(Atoms?.UserAtom);
  return <UnifiedHomeDashboard />;
}
