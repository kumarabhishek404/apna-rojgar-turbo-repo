import React from "react";
import { useAtomValue } from "jotai";
import Atoms from "../AtomStore";
import AdminProfile from "../screens/bottomTabs/(admin)/profile";
import UserProfile from "../screens/bottomTabs/(user)/profile";

/** Profile tab — same route for every role; admin keeps dedicated profile shell. */
export default function ProfileTabScreen() {
  const userDetails = useAtomValue(Atoms?.UserAtom);

  if (userDetails?.isAdmin) return <AdminProfile />;
  return <UserProfile />;
}
