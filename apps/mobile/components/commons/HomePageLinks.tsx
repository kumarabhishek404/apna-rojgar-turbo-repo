import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useMemo } from "react";
import { router } from "expo-router";
import Farmer1 from "../../assets/farmer1.png";
import Farmer2 from "../../assets/farmer2.png";
import Farmer3 from "../../assets/farmer3.png";
import Farmer4 from "../../assets/farmer4.png";
import Farmer6 from "../../assets/farmer6.png";
import Farmer8 from "../../assets/farmer8.png";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";
import APP_CONTEXT from "@/app/context/locale";

type LinkItem = {
  title: string;
  subtitle: string;
  onPress: any;
  image: any;
  big?: boolean;
  style: any;
};

const FARMER_IMAGES = [Farmer1, Farmer2, Farmer3, Farmer4, Farmer6, Farmer8];

const HomePageLinks = () => {
  const userDetails: any = useAtomValue(Atoms?.UserAtom);
  const { role } = APP_CONTEXT.useApp();

  /**
   * 🔥 SAME DASHBOARD CONFIG (but we only use stats)
   */
  const ROLE_CONFIG: Record<string, any> = {
    WORKER: {
      stats: [
        {
          title: "dashboard.worker.applied",
          subtitle: "dashboard.worker.appliedDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
        {
          title: "dashboard.worker.bookings",
          subtitle: "dashboard.worker.bookingsDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 1 } }),
        },
        {
          title: "dashboard.worker.contractors",
          subtitle: "dashboard.worker.contractorsDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/third", params: { tab: 1 } }),
        },
        {
          title: "dashboard.worker.activity",
          subtitle: "dashboard.worker.activityDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
      ],
    },

    EMPLOYER: {
      stats: [
        {
          title: "dashboard.employer.postWork",
          subtitle: "dashboard.employer.postWorkDesc",
          onPress: () =>
            router.push({
              pathname: "/screens/addService",
              params: { tab: 0 },
            }),
        },
        {
          title: "dashboard.employer.bookedWorkers",
          subtitle: "dashboard.employer.bookedWorkersDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 1 } }),
        },
        {
          title: "dashboard.employer.contractors",
          subtitle: "dashboard.employer.contractorsDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/third", params: { tab: 1 } }),
        },
        {
          title: "dashboard.employer.workers",
          subtitle: "dashboard.employer.workersDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/second", params: { tab: 1 } }),
        },
        {
          title: "dashboard.employer.activity",
          subtitle: "dashboard.employer.activityDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
      ],
    },

    MEDIATOR: {
      stats: [
        {
          title: "dashboard.mediator.postRequirement",
          subtitle: "dashboard.mediator.postRequirementDesc",
          onPress: () =>
            router.push({
              pathname: "/screens/addService",
              params: { tab: 1 },
            }),
        },
        {
          title: "dashboard.mediator.myPostedJobs",
          subtitle: "dashboard.mediator.myPostedJobsDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
        {
          title: "dashboard.mediator.applied",
          subtitle: "dashboard.mediator.appliedDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 1 } }),
        },
        {
          title: "dashboard.mediator.team",
          subtitle: "dashboard.mediator.teamDesc",
          onPress: () =>
            router.push({
              pathname: "/screens/team/[id]",
              params: { id: userDetails?._id },
            }),
        },
        {
          title: "dashboard.mediator.workers",
          subtitle: "dashboard.mediator.workersDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/second", params: { tab: 1 } }),
        },
        {
          title: "dashboard.mediator.activity",
          subtitle: "dashboard.mediator.activityDesc",
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
      ],
    },
  };

  /**
   * 🔥 Transform stats → UI cards
   */
  const links: LinkItem[] = useMemo(() => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG["WORKER"];

    return config.stats.map((item: any, index: number) => ({
      title: t(item.title),
      subtitle: t(item.subtitle) || "", // fallback generic subtitle
      onPress: item.onPress,
      image: FARMER_IMAGES[index % FARMER_IMAGES.length],
      big: index < 2, // first 2 big, rest small
      style: [
        index < 2 ? styles.largeBox : styles.smallBox,
        index === 0
          ? styles.serviceBox
          : index === 1
            ? styles.employerBox
            : index === 2
              ? styles.bookingBox
              : styles.helpBox,
      ],
    }));
  }, [role]);

  return (
    <View style={styles.linksContainer}>
      <View style={styles.gridContainer}>
        {links.map((link: LinkItem, index: number) => (
          <TouchableOpacity
            key={index}
            style={link.style}
            activeOpacity={0.9}
            onPress={link?.onPress}
          >
            <View style={styles.textContainer}>
              <CustomHeading textAlign="left" baseFont={16}>
                {link.title}
              </CustomHeading>

              <CustomText textAlign="left" baseFont={12}>
                {link.subtitle}
              </CustomText>
            </View>

            <View style={styles.imageContainer}>
              <Image
                source={link.image}
                style={link.big ? styles.largeImage : styles.smallImage}
              />
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 10,
  },
  largeBox: {
    width: "48%",
    // height: 176,
    minHeight: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 0,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    marginBottom: 8,
  },
  smallBox: {
    width: "48%",
    // height: 80,
    minHeight: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 0,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    marginBottom: 8,
  },
  serviceBox: {
    backgroundColor: "#E0F7FA",
  },
  employerBox: {
    backgroundColor: "#FCE4EC",
  },
  mediatorBox: {
    backgroundColor: "#FFF3E0",
  },
  bookingBox: {
    backgroundColor: "#E8F5E9",
  },
  helpBox: {
    backgroundColor: "#FFFDE7",
  },
  textContainer: {
    width: "75%",
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: "flex-start",
    zIndex: 1,
  },
  imageContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    // overflow: "hidden",
  },
  largeImage: {
    width: 110,
    height: 140,
    resizeMode: "cover",
    borderBottomRightRadius: 12,
  },
  smallImage: {
    width: 85,
    height: 100,
    resizeMode: "cover",
    borderBottomRightRadius: 8,
  },
});
