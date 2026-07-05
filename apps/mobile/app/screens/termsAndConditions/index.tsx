import CustomHeader from "@/components/commons/Header";
import LegalDocumentView from "@/components/commons/LegalDocumentView";
import Colors from "@/constants/Colors";
import { TERMS_SECTIONS } from "@/constants/legalDocuments";
import { Stack } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";

const TermsAndConditions = () => {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              title="termsAndConditions"
              left="back"
              right="notification"
            />
          ),
        }}
      />
      <View style={styles.container}>
        <LegalDocumentView
          introKey="termsAndConditionsIntro"
          lastUpdatedKey="termsAndConditionsLastUpdated"
          sections={[...TERMS_SECTIONS]}
        />
      </View>
    </>
  );
};

export default TermsAndConditions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.fourth,
  },
});
