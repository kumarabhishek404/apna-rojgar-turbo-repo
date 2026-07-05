import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useMemo } from "react";
import { router } from "expo-router";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";
import APP_CONTEXT from "@/app/context/locale";

type AssetKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type LinkItem = {
  title: string;
  onPress: () => void;
  imageKey: AssetKey;
};

const APNA_ASSETS: Record<AssetKey, ImageSourcePropType> = {
  1: require("../../assets/apna_rojgar_assets/1.png"),
  2: require("../../assets/apna_rojgar_assets/2.png"),
  3: require("../../assets/apna_rojgar_assets/3.png"),
  4: require("../../assets/apna_rojgar_assets/4.png"),
  5: require("../../assets/apna_rojgar_assets/5.png"),
  6: require("../../assets/apna_rojgar_assets/6.png"),
  7: require("../../assets/apna_rojgar_assets/7.png"),
  8: require("../../assets/apna_rojgar_assets/8.png"),
  9: require("../../assets/apna_rojgar_assets/9.png"),
  10: require("../../assets/apna_rojgar_assets/10.png"),
  11: require("../../assets/apna_rojgar_assets/11.png"),
  12: require("../../assets/apna_rojgar_assets/12.png"),
};

const HomePageLinks = () => {
  const userDetails: any = useAtomValue(Atoms?.UserAtom);
  const { role } = APP_CONTEXT.useApp();

  const ROLE_CONFIG: Record<
    string,
    { stats: Array<{ title: string; onPress: () => void; imageKey: AssetKey }> }
  > = {
    WORKER: {
      stats: [
        {
          title: "dashboard.worker.applied",
          imageKey: 10,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
        {
          title: "dashboard.worker.bookings",
          imageKey: 9,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 1 } }),
        },
        {
          title: "dashboard.worker.contractors",
          imageKey: 2,
          onPress: () =>
            router.push({ pathname: "/(tabs)/third", params: { tab: 1 } }),
        },
        {
          title: "dashboard.worker.activity",
          imageKey: 6,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
      ],
    },

    EMPLOYER: {
      stats: [
        {
          title: "dashboard.employer.postWork",
          imageKey: 12,
          onPress: () =>
            router.push({
              pathname: "/screens/addService",
              params: { tab: 0 },
            }),
        },
        {
          title: "dashboard.employer.bookedWorkers",
          imageKey: 1,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 1 } }),
        },
        {
          title: "dashboard.employer.contractors",
          imageKey: 2,
          onPress: () =>
            router.push({ pathname: "/(tabs)/third", params: { tab: 1 } }),
        },
        {
          title: "dashboard.employer.workers",
          imageKey: 5,
          onPress: () =>
            router.push({ pathname: "/(tabs)/second", params: { tab: 1 } }),
        },
        {
          title: "dashboard.employer.activity",
          imageKey: 10,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
      ],
    },

    MEDIATOR: {
      stats: [
        {
          title: "dashboard.mediator.postWork",
          imageKey: 12,
          onPress: () =>
            router.push({
              pathname: "/screens/addService",
              params: { tab: 1 },
            }),
        },
        {
          title: "dashboard.mediator.myPostedJobs",
          imageKey: 8,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
        {
          title: "dashboard.mediator.applied",
          imageKey: 3,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 1 } }),
        },
        {
          title: "dashboard.mediator.team",
          imageKey: 11,
          onPress: () =>
            router.push({
              pathname: "/screens/team/[id]",
              params: { id: userDetails?._id },
            }),
        },
        {
          title: "dashboard.mediator.workers",
          imageKey: 1,
          onPress: () =>
            router.push({ pathname: "/(tabs)/second", params: { tab: 1 } }),
        },
        {
          title: "dashboard.mediator.activity",
          imageKey: 6,
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
      ],
    },
  };

  const links: LinkItem[] = useMemo(() => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.WORKER;

    return config.stats.map((item) => ({
      title: t(item.title),
      onPress: item.onPress,
      imageKey: item.imageKey,
    }));
  }, [role, userDetails?._id]);

  return (
    <View style={styles.linksContainer}>
      <CustomHeading
        textAlign="left"
        baseFont={18}
        fontWeight="800"
        style={styles.sectionTitle}
      >
        {t("getStarted")}
      </CustomHeading>

      <View style={styles.gridContainer}>
        {links.map((link, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.85}
            onPress={link.onPress}
          >
            <View style={styles.imageWrap}>
              <Image
                source={APNA_ASSETS[link.imageKey]}
                style={styles.cardImage}
              />
            </View>

            <View style={styles.titleWrap}>
              <CustomText
                textAlign="center"
                baseFont={13}
                fontWeight="700"
                color="#1F2E4D"
                numberOfLines={2}
              >
                {link.title}
              </CustomText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default HomePageLinks;

const styles = StyleSheet.create({
  linksContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#1F2E4D",
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 12,
  },
  card: {
    width: "47.5%",
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4EAF3",
    overflow: "hidden",
    shadowColor: "#1F2E4D",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageWrap: {
    width: "100%",
    height: 108,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    // borderColor: "red",
    // borderWidth: 1,
  },
  titleWrap: {
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
});
