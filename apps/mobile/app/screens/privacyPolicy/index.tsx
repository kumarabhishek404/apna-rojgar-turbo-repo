import CustomHeader from "@/components/commons/Header";
import LegalDocumentView from "@/components/commons/LegalDocumentView";
import Colors from "@/constants/Colors";
import { PRIVACY_POLICY_SECTIONS } from "@/constants/legalDocuments";
import { Stack } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";

const PrivacyPolicyScreen = () => {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader title="privacyPolicy" left="back" right="notification" />
          ),
        }}
      />
      <View style={styles.container}>
        <LegalDocumentView
          introKey="privacyPolicyIntro"
          lastUpdatedKey="privacyPolicyLastUpdated"
          sections={[...PRIVACY_POLICY_SECTIONS]}
        />
      </View>
    </>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fourth,
  },
});
