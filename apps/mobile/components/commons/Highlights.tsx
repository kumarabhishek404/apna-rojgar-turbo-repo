import Colors from "@/constants/Colors";
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ButtonComp from "../inputs/Button";
import { getDistanceFromLocation, handleCall } from "@/constants/functions";
import CustomText from "./CustomText";
import CustomHeading from "./CustomHeading";
import { t } from "@/utils/translationHelper";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";

const formatPhoneDisplay = (mobile: string) => {
  const digits = String(mobile).replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
};

const Highlights = ({ service, compact }: { service: any; compact?: boolean }) => {
  const userDetails = useAtomValue(Atoms?.UserAtom);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    const fetchDistance = async () => {
      const dist = await getDistanceFromLocation(
        service?.geoLocation,
        userDetails?.geoLocation,
        service?.address,
      );
      setDistance(typeof dist === "number" && !isNaN(dist) ? dist : null);
    };

    fetchDistance();
  }, [service, userDetails]);

  const employerId =
    typeof service?.employer === "string"
      ? service.employer
      : service?.employer?._id;
  const showCallButton =
    service?.employer?.mobile && userDetails?._id !== employerId;

  const durationValue = service?.duration
    ? t("lessThanMultipleDays", { duration: service.duration })
    : "—";

  const distanceValue =
    distance !== null ? `${distance} ${t("kms")}` : "—";

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <View style={styles.statIconWrap}>
            <Ionicons name="time-outline" size={16} color={Colors.primary} />
          </View>
          <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
            {t("duration")}
          </CustomText>
          <CustomHeading textAlign="left" baseFont={15}>
            {durationValue}
          </CustomHeading>
        </View>

        <View style={styles.statTile}>
          <View style={styles.statIconWrap}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={16}
              color={Colors.primary}
            />
          </View>
          <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
            {t("distance")}
          </CustomText>
          <CustomHeading textAlign="left" baseFont={15}>
            {service?.address ? distanceValue : t("noLocationFound")}
          </CustomHeading>
        </View>
      </View>

      {service?.employer?.mobile ? (
        <View style={styles.contactSection}>
          <View style={styles.contactHeader}>
            <View style={styles.contactIconWrap}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.contactTextWrap}>
              <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
                {t("mobileNumber")}
              </CustomText>
              <CustomHeading textAlign="left" baseFont={18}>
                {formatPhoneDisplay(service.employer.mobile)}
              </CustomHeading>
            </View>
          </View>

          {showCallButton ? (
            <ButtonComp
              isPrimary
              title={t("callEmployer")}
              onPress={() =>
                handleCall(service.employer.mobile, {
                  source: "service_highlights",
                  serviceId: String(service?._id ?? ""),
                })
              }
              style={styles.callButton}
              textStyle={styles.callButtonText}
              icon={
                <FontAwesome5
                  name="phone-alt"
                  size={15}
                  color={Colors.white}
                  style={{ marginRight: 8 }}
                />
              }
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    gap: 16,
  },
  containerCompact: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.fourth,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.08)",
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  contactSection: {
    gap: 12,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.fourth,
    alignItems: "center",
    justifyContent: "center",
  },
  contactTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  callButton: {
    width: "100%",
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  callButtonText: {
    fontSize: 15,
    flexWrap: "nowrap",
  },
});

export default Highlights;
