import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import Colors from "@/constants/Colors";
import AccountSuspendedScreen from "@/components/commons/AccountSuspendedScreen";
import { isAccountSuspended } from "@/utils/userStatus";

/**
 * Blocks the rest of the app when the signed-in user is SUSPENDED.
 * The navigator stays mounted underneath so logout and routing still work.
 */
const AccountAccessGuard = ({ children }: { children: ReactNode }) => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const suspended = isAccountSuspended(userDetails);

  return (
    <View style={styles.root}>
      <View
        style={styles.content}
        pointerEvents={suspended ? "none" : "auto"}
        accessibilityElementsHidden={suspended}
        importantForAccessibility={suspended ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>
      {suspended ? (
        <View
          style={styles.lock}
          pointerEvents="auto"
          accessibilityViewIsModal
        >
          <AccountSuspendedScreen />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  lock: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: Colors.error,
  },
});

export default AccountAccessGuard;
