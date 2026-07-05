import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import Colors from "@/constants/Colors";
import { getDistanceFromLocation, handleCall } from "@/constants/functions";
import { t } from "@/utils/translationHelper";
import ButtonComp from "../inputs/Button";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import DateDisplay from "./ShowDate";

type Props = {
  service: any;
};

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
};

const InfoRow = ({ icon, label, children }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <CustomText
        textAlign="left"
        baseFont={12}
        color={Colors.subHeading}
        style={styles.infoLabel}
      >
        {label}
      </CustomText>
      {children}
    </View>
  </View>
);

type StatTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

const StatTile = ({ icon, label, value }: StatTileProps) => (
  <View style={styles.statTile}>
    <View style={styles.statIconWrap}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
    </View>
    <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
      {label}
    </CustomText>
    <CustomHeading textAlign="left" baseFont={15} style={styles.statValue}>
      {value}
    </CustomHeading>
  </View>
);

const formatPhoneDisplay = (mobile: string) => {
  const digits = String(mobile).replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
};

const ServiceLocationScheduleSection = ({ service }: Props) => {
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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="location-outline" size={20} color={Colors.primary} />
        </View>
        <CustomHeading textAlign="left" baseFont={16} color={Colors.black}>
          {t("locationAndSchedule")}
        </CustomHeading>
      </View>

      <InfoRow icon="map-outline" label={t("address")}>
        <CustomText textAlign="left" baseFont={15} style={styles.addressText}>
          {service?.address || t("addressNotFound")}
        </CustomText>
      </InfoRow>

      <View style={styles.divider} />

      <InfoRow icon="calendar-outline" label={t("startDate")}>
        <DateDisplay
          date={service?.startDate}
          type="startDate"
          showLeadingEmoji={false}
          styles={styles.dateText}
        />
      </InfoRow>

      <View style={styles.statsRow}>
        <StatTile
          icon="time-outline"
          label={t("duration")}
          value={durationValue}
        />
        <StatTile
          icon="navigate-outline"
          label={t("distance")}
          value={distanceValue}
        />
      </View>

      {service?.employer?.mobile ? (
        <>
          <View style={styles.divider} />
          <View style={styles.contactSection}>
            <View style={styles.contactHeader}>
              <View style={styles.contactIconWrap}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.contactTextWrap}>
                <CustomText
                  textAlign="left"
                  baseFont={12}
                  color={Colors.subHeading}
                >
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
                    source: "service_location_schedule",
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
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.1)",
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.fourth,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.fourth,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  infoLabel: {
    letterSpacing: 0.2,
    fontWeight: "600",
  },
  addressText: {
    lineHeight: 22,
    color: Colors.text,
  },
  dateText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(34, 64, 154, 0.08)",
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
  statValue: {
    lineHeight: 22,
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

export default ServiceLocationScheduleSection;
