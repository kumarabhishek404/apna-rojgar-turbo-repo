import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";

type Section = {
  titleKey: string;
  bodyKey: string;
};

type Props = {
  introKey: string;
  lastUpdatedKey: string;
  sections: Section[];
};

const LegalDocumentView = ({ introKey, lastUpdatedKey, sections }: Props) => {
  return (
    <ScrollView
      style={styles.contentContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contentBox}>
        <CustomText textAlign="left" baseFont={15} style={styles.intro}>
          {t(introKey)}
        </CustomText>

        {sections.map((section) => (
          <View key={section.titleKey} style={styles.section}>
            <CustomHeading textAlign="left" baseFont={16} color={Colors.primary}>
              {t(section.titleKey)}
            </CustomHeading>
            <CustomText textAlign="left" baseFont={14} style={styles.body}>
              {t(section.bodyKey)}
            </CustomText>
          </View>
        ))}

        <CustomText textAlign="left" baseFont={13} color={Colors.subHeading} style={styles.updated}>
          {t(lastUpdatedKey)}
        </CustomText>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  contentBox: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    gap: 4,
  },
  intro: {
    lineHeight: 22,
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
    gap: 6,
  },
  body: {
    lineHeight: 22,
    color: Colors.text,
  },
  updated: {
    marginTop: 24,
    fontWeight: "600",
  },
});

export default LegalDocumentView;
