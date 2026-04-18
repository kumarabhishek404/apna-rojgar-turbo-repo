import { StyleSheet, TouchableOpacity, View, Image } from "react-native";
import React from "react";
import Colors from "@/constants/Colors";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";
import { router } from "expo-router";
import ProfilePicture from "./ProfilePicture";
import ButtonComp from "../inputs/Button";
import DateDisplay from "./ShowDate";
import ShowDuration from "./ShowDuration";
import { getDynamicWorkerType } from "@/utils/i18n";

const ListingsBookedWorkers = ({
  title,
  item,
  category,
  /** When true, show applied vs selected counts (Activity / employer hub). */
  showEngagementStrip,
}: any) => {
  const appliedCount = Array.isArray(item?.appliedUsers)
    ? item.appliedUsers.length
    : 0;
  let selectedCount = 0;
  (item?.selectedUsers || []).forEach((su: any) => {
    if (su?.status === "SELECTED" || su?.status === "SERVICE_COMPLETED") {
      selectedCount += 1;
    }
    if (Array.isArray(su?.workers)) {
      selectedCount += su.workers.filter(
        (w: any) => w?.status === "SELECTED",
      ).length;
    }
  });

  let workersList =
    item?.bookingType === "byService"
      ? [
          ...(item.selectedUsers?.filter(
            (user: any) => user?.status === "SELECTED"
          ) || []),
          ...item.selectedUsers
            .filter((user: any) => user?.status === "SELECTED")
            .flatMap((user: any) => user?.workers || []),
        ]
      : [item?.bookedWorker];

  const firstWorker = workersList?.[0];

  console.log("firstWorker----", firstWorker);

  return (
    <View style={styles.container} key={item?._id}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/screens/bookings/[id]",
            params: {
              id: item?._id,
              title: title,
              data: JSON.stringify(item),
              category: category,
            },
          })
        }
      >
        <View style={styles.card}>
          {showEngagementStrip ? (
            <View style={styles.engagementStrip}>
              <View style={styles.engagementPill}>
                <CustomText baseFont={12} fontWeight="700" color={Colors.primary}>
                  {appliedCount} {t("activityBadgeApplied")} · {selectedCount}{" "}
                  {t("activityBadgeSelected")}
                </CustomText>
              </View>
            </View>
          ) : null}
          {/* Worker Profile Section */}
          <View style={styles.workerHeader}>
            <View style={styles.workerImagesContainer}>
              {workersList?.slice(0, 5).map((worker: any, index: number) => (
                <ProfilePicture
                  key={index}
                  uri={worker.profilePicture}
                  style={[styles.workerImage, { left: index * 20 }]}
                />
              ))}
            </View>

            <View style={styles.workerInfo}>
              <CustomHeading baseFont={18} fontWeight="bold" textAlign="right">
                {workersList && workersList?.length > 1
                  ? t("moreThanOneWorkers")
                  : firstWorker?.name}
              </CustomHeading>
              {workersList && workersList?.length > 1 ? (
                <CustomText
                  baseFont={15}
                  color={Colors.tertieryButton}
                  textAlign="right"
                >
                  {t("multipleSkills")}
                </CustomText>
              ) : (
                <CustomText
                  baseFont={15}
                  color={Colors.tertieryButton}
                  textAlign="right"
                >
                  {getDynamicWorkerType(item?.appliedSkill?.skill, 1)}
                  <CustomText fontWeight="600" color={Colors.tertieryButton}>
                    {" - "} ({item?.appliedSkill?.pricePerDay} {t("perDay")})
                  </CustomText>
                </CustomText>
              )}
            </View>
          </View>

          {/* Worker Status & Contact */}
          <View style={styles.statusContainer}>
            <CustomText
              style={{ flex: 1 }}
              textAlign="left"
              baseFont={14}
              color={Colors?.subHeading}
            >
              {firstWorker?.address}
            </CustomText>
            <CustomText
              style={{ width: "30%" }}
              textAlign="right"
              baseFont={14}
              color={Colors.primary}
            >
              📞 {firstWorker?.mobile}
            </CustomText>
          </View>

          {/* Booking Info (Secondary) */}
          <View style={styles.bookingDetails}>
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 5,
              }}
            >
              {item?.subType && (
                <CustomHeading textAlign="left" style={{ flex: 1 }}>
                  {t(item?.subType)}
                </CustomHeading>
              )}
              <ShowDuration duration={item?.duration} />
            </View>
            <DateDisplay date={item?.startDate} type="startDate" />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              {item?.status === "HIRING" && (
                <ButtonComp
                  isPrimary={true}
                  title={t("addAttendance")}
                  onPress={() =>
                    router?.push({
                      pathname: "/screens/bookings/addAttendance",
                      params: {
                        bookingDetails: JSON.stringify(item),
                        workers: JSON.stringify(workersList),
                      },
                    })
                  }
                  textStyle={{ fontSize: 16 }}
                  style={{ width: "100%", marginTop: 15, paddingVertical: 6 }}
                />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default ListingsBookedWorkers;

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 15 },
  engagementStrip: { marginBottom: 10 },
  engagementPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(34, 64, 154, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  card: {
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 8,
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  workerImagesContainer: {
    flexDirection: "row",
    position: "relative",
    width: 62,
    height: 62,
  },
  workerImage: {
    position: "absolute",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  workerInfo: {
    flex: 1,
    marginLeft: 20,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bookingDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.secondary,
    paddingTop: 8,
  },
});
