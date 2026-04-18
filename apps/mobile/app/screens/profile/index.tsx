import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import CustomHeader from "@/components/commons/Header";
import UserProfile from "@/app/screens/bottomTabs/(user)/profile";
import AdminProfile from "@/app/screens/bottomTabs/(admin)/profile";

export default function ProfileScreen() {
  const userDetails = useAtomValue(Atoms?.UserAtom);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomHeader title="myProfile" left="back" />
      {userDetails?.isAdmin ? <AdminProfile /> : <UserProfile />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
