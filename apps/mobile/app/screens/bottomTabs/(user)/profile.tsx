import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import { useAtom } from "jotai";
import ModalComponent from "@/components/commons/Modal";
import USER from "../../../api/user";
import { useMutation } from "@tanstack/react-query";
import Loader from "@/components/commons/Loaders/Loader";
import AvatarComponent from "@/components/commons/Avatar";
import Button from "@/components/inputs/Button";
import UserInfoComponent from "@/components/commons/UserInfoBox";
import TextInputComponent from "@/components/inputs/TextInputWithIcon";
import { Controller, useForm } from "react-hook-form";
import TOAST from "@/app/hooks/toast";
import { WORKERTYPES } from "@/constants";
import SkillSelector from "@/components/commons/SkillSelector";
import WorkInformation from "@/components/commons/WorkInformation";
import ServiceInformation from "@/components/commons/ServiceInformation";
import StatsCard from "@/components/commons/LikesStats";
import ProfileMenu from "@/components/commons/ProfileMenu";
import InactiveAccountMessage from "@/components/commons/InactiveAccountMessage";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import APP_CONTEXT from "@/app/context/locale";
import PendingApprovalMessage from "@/components/commons/PendingApprovalAccountMessage";
import TeamAdminCard from "@/components/commons/TeamAdminCard";
import { t } from "@/utils/translationHelper";
import EmailAddressField from "@/components/inputs/EmailAddress";
import ProfileNotification from "@/components/commons/CompletProfileNotify";
import REFRESH_USER from "@/app/hooks/useRefreshUser";
import USE_LOGOUT from "@/app/hooks/useLogout";
import JoinWhatsAppGroup from "@/components/commons/JoinWhatsappGroup";
import FollowInstagram from "@/components/commons/JoinInstagramAccount";
import RoleSwitcher from "@/components/commons/RoleSwitcher";
import { isCoreProfileIncomplete } from "@/constants/functions";

type TabKey = "overview" | "settings";

const ROLE_META: Record<string, { emoji: string; color: string; bg: string }> = {
  WORKER:   { emoji: "👷", color: "#1D4ED8", bg: "#EEF4FF" },
  EMPLOYER: { emoji: "🧑‍💼", color: "#065F46", bg: "#ECFDF5" },
  MEDIATOR: { emoji: "🤝", color: "#7C3AED", bg: "#F5F3FF" },
};

const UserProfile = () => {
  APP_CONTEXT?.useApp();
  const [userDetails, setUserDetails] = useAtom(Atoms?.UserAtom);
  const { role, setRole } = APP_CONTEXT.useApp();
  const [selectedTab, setSelectedTab] = useState<TabKey>("overview");
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const TABS: { key: TabKey; icon: any; label: string }[] = [
    { key: "overview",  icon: "person-outline",  label: "overview"    },
    { key: "settings",  icon: "settings-outline", label: "settingsTab" },
  ];
  const [isEditProfile, setIsEditProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState(
    userDetails?.profilePicture,
  );
  const [loading, setLoading] = useState(false);
  const { logout } = USE_LOGOUT.useLogout();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: userDetails?.name,
      email: userDetails?.email?.value,
      address: userDetails?.address,
    },
  });

  const { refreshUser, isLoading } = REFRESH_USER.useRefreshUser();

  useEffect(() => {
    setRole(userDetails?.role || "");
  }, [userDetails]);

  useEffect(() => {
    const nextProfilePicture =
      userDetails?.profilePicture || userDetails?.profileImage || "";
    setProfilePicture(nextProfilePicture);
  }, [userDetails?.profilePicture, userDetails?.profileImage]);

  // useEffect(() => {
  //   const validateUserToken = async () => {
  //     try {
  //       setLoading(true);
  //       const token = await getToken();

  //       if (!token) {
  //         return logout();
  //       }

  //       const response = await AUTH.validateToken();

  //       if (response?.errorCode === "TOKEN_VALID") {
  //         console.log("Token is valid");
  //         refreshUser();
  //         setLoading(false);
  //       } else {
  //         logout(); // 🔥 logout immediately on invalid token
  //       }
  //     } catch (error) {
  //       console.error("Error validating token:", error);
  //       logout(); // 🔥 logout on any error also
  //     }
  //   };

  //   validateUserToken();
  // }, [logout]);

  useEffect(() => {
    const backAction = () => {
      if (userDetails?.status !== "ACTIVE") {
        TOAST?.error(
          `${
            userDetails?.status === "SUSPENDED" ||
            userDetails?.status === "DISABLED"
              ? t("profileSuspended")
              : t("approvalIsPending")
          }: ${t("youCantUntilYourProfileIs")} ${
            userDetails?.status === "SUSPENDED" ||
            userDetails?.status === "DISABLED"
              ? t("suspended")
              : t("notApproved")
          }.`,
        );
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => subscription.remove();
  }, [userDetails]);

  useEffect(() => {
    setValue("name", userDetails?.name);
    setValue("email", userDetails?.email?.value);
  }, [isEditProfile, userDetails]);

  const mutationUpdateProfileInfo = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: (payload: any) => USER?.updateUserById(payload),
    onSuccess: (response) => {
      console.log(
        "Response while updating the profile - ",
        response?.data?.data?.email,
      );
      let user = response?.data?.data;
      const nextProfilePicture = user?.profilePicture || user?.profileImage || "";
      setIsEditProfile(false);
      setProfilePicture(nextProfilePicture);
      setUserDetails({
        ...userDetails,
        name: user?.name,
        profilePicture: nextProfilePicture,
        profileImage: nextProfilePicture,
        email: {
          value: user?.email?.value,
          isVerified: false,
        },
      });
    },
    onError: (err) => {
      console.error("error while updating the profile ", err);
      setIsEditProfile(false);
    },
  });

  const mutationUpdateRole = useMutation({
    mutationKey: ["updateRole"],
    mutationFn: (newRole: string) =>
      USER.updateUserById({ _id: userDetails._id, role: newRole }),
    onSuccess: (response) => {
      const updatedUser = response?.data?.data;
      if (updatedUser) {
        setUserDetails({
          ...userDetails,
          role: updatedUser.role,
        });
      }
    },
    onError: (error) => {
      console.error("Error updating role: ", error);
      // TOAST?.error(t("roleUpdateFailed"));
    },
  });

  const mutationUpdateProfilePicture = useMutation({
    mutationKey: ["updateProfilePicture"],
    mutationFn: (payload: any) => USER?.updateUserById(payload),
    onSuccess: (response) => {
      let user = response?.data?.data;
      const nextProfilePicture = user?.profilePicture || user?.profileImage || "";
      setProfilePicture(nextProfilePicture);
      setUserDetails({
        ...userDetails,
        profilePicture: nextProfilePicture,
        profileImage: nextProfilePicture,
      });
    },
  });

  const handleProfilePictureSubmit = async (profileImage: any) => {
    if (
      !profileImage ||
      typeof profileImage !== "string" ||
      profileImage.trim() === ""
    ) {
      TOAST?.error(t("pleaseSelectAProfilePicture"));
      return;
    }

    const formData: any = new FormData();
    const imageName = profileImage.split("/").pop();
    formData.append("profileImage", {
      uri:
        Platform.OS === "android"
          ? profileImage
          : profileImage.replace("file://", ""),
      type: "image/jpeg",
      name: imageName || "photo.jpg",
    });
    formData?.append("_id", userDetails?._id);

    // Optimistic update so avatar changes instantly without app restart.
    setProfilePicture(profileImage);
    setUserDetails({
      ...userDetails,
      profilePicture: profileImage,
      profileImage,
    });

    mutationUpdateProfilePicture.mutate(formData);
  };

  const mutationAddSkills = useMutation({
    mutationKey: ["addSkills"],
    mutationFn: (skill: any) => USER?.updateSkills({ skill: skill }),
    onSuccess: (response) => {
      let user = response?.data;
      setUserDetails({
        ...userDetails,
        skills: user?.skills,
      });
      TOAST?.success(t("skillsAddedSuccessfully"));
      // console.log("Response while adding new skills in a worker - ", response);
    },
    onError: (err) => {
      console.error("error while adding new skills in a worker ", err);
    },
  });

  const mutationRemoveSkill = useMutation({
    mutationKey: ["removeSkills"],
    mutationFn: (skill: string) => USER?.removeSkill({ skillName: skill }),
    onSuccess: (response) => {
      let user = response?.data;
      setUserDetails({
        ...userDetails,
        skills: user?.skills,
      });
      TOAST?.success(t("skillRemovedSuccessfully"));
      console.log("Response while removing skill from the worker - ", response);
    },
    onError: (err) => {
      console.error("error while removing skill from the worker ", err);
    },
  });

  const handleEditProfile = () => {
    setIsEditProfile(true);
  };

  const modalContent = () => {
    return (
      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="name"
          defaultValue=""
          rules={{
            required: t("firstNameIsRequired"),
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInputComponent
              label="name"
              name="name"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={t("enterYourFirstName")}
              errors={errors}
              icon={
                <Ionicons
                  name="person"
                  size={30}
                  color={Colors.secondary}
                  style={{ paddingVertical: 10, paddingRight: 10 }}
                />
              }
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          defaultValue=""
          render={({ field: { onChange, onBlur, value } }) => (
            <EmailAddressField
              name="email"
              email={value}
              setEmail={onChange}
              errors={errors}
              placeholder={t("enterYourEmailAddress")}
              icon={
                <Ionicons
                  name={"mail-outline"}
                  size={30}
                  color={Colors.secondary}
                  style={{ paddingVertical: 10, marginRight: 10 }}
                />
              }
            />
          )}
        />
      </View>
    );
  };

  const onSubmit = (data: any) => {
    let updatedFields: any = {
      _id: userDetails._id,
    };

    if (data?.name !== userDetails?.name) {
      updatedFields.name = data?.name;
    }

    if (data?.email !== userDetails?.email?.value) {
      updatedFields.email = data?.email;
    }

    if (Object.keys(updatedFields).length > 1) {
      mutationUpdateProfileInfo?.mutate(updatedFields);
    } else {
      TOAST?.error(t("makeChangesToSave"));
    }
  };

  const handleRefreshUser = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error("Error while refreshing user - ", error);
      TOAST?.error("Error while refreshing user");
    }
  };

  const roleMeta = ROLE_META[role] ?? ROLE_META["WORKER"];

  return (
    <>
      <Loader
        loading={
          mutationUpdateProfileInfo?.isPending ||
          mutationUpdateRole?.isPending ||
          mutationAddSkills?.isPending ||
          mutationRemoveSkill?.isPending ||
          isLoading ||
          loading
        }
      />

      {/* Role-change modal */}
      <RoleSwitcher
        currentRole={role}
        onChangeRole={(newRole: any) => {
          setRole(newRole);
          mutationUpdateRole.mutate(newRole);
          setRoleModalVisible(false);
        }}
        externalVisible={roleModalVisible}
        onExternalClose={() => setRoleModalVisible(false)}
      />

      <ModalComponent
        visible={isEditProfile}
        title={t("editProfile")}
        onClose={() => setIsEditProfile(false)}
        content={modalContent}
        primaryButton={{ action: handleSubmit(onSubmit) }}
        secondaryButton={{ action: () => setIsEditProfile(false) }}
      />

      <View style={styles.container}>
        {/* ── 2-tab bar ── */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = selectedTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setSelectedTab(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={active ? Colors.white : "rgba(255,255,255,0.5)"}
                />
                <CustomText
                  baseFont={12}
                  fontWeight={active ? "700" : "normal"}
                  color={active ? Colors.white : "rgba(255,255,255,0.5)"}
                >
                  {t(tab.label)}
                </CustomText>
                {active && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Overview tab ── */}
        {selectedTab === "overview" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero / identity section */}
            <View style={styles.heroCard}>
              <AvatarComponent
                isLoading={mutationUpdateProfilePicture?.isPending}
                isEditable={true}
                onUpload={handleProfilePictureSubmit}
                profileImage={profilePicture}
              />
              <CustomHeading baseFont={22} style={styles.heroName}>
                {userDetails?.name || "Name"}
              </CustomHeading>

              {/* Role pill + change role btn */}
              <View style={styles.roleRow}>
                <View style={[styles.rolePill, { backgroundColor: roleMeta.bg }]}>
                  <CustomText baseFont={13} fontWeight="700" color={roleMeta.color}>
                    {roleMeta.emoji}{"  "}{t(role?.toLowerCase() || "worker")}
                  </CustomText>
                </View>
                <TouchableOpacity
                  style={styles.changeRoleBtn}
                  onPress={() => setRoleModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={14} color={Colors.white} />
                  <CustomText baseFont={12} fontWeight="700" color={Colors.white}>
                    {t("changeRole")}
                  </CustomText>
                </TouchableOpacity>
              </View>

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={handleRefreshUser}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                  <CustomText baseFont={13} fontWeight="700" color={Colors.primary}>
                    {t("refreshUser")}
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnSolid]}
                  onPress={() => !isEditProfile && handleEditProfile()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={16} color={Colors.white} />
                  <CustomText baseFont={13} fontWeight="700" color={Colors.white}>
                    {t("editProfile")}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* White rounded content sheet */}
            <View style={styles.contentSheet}>
              {isCoreProfileIncomplete(userDetails as Record<string, unknown>) && (
                <ProfileNotification />
              )}
              {(userDetails?.status === "SUSPENDED" ||
                userDetails?.status === "DISABLED") && <InactiveAccountMessage />}
              {userDetails?.status === "PENDING" && <PendingApprovalMessage />}

              <StatsCard />

              <SkillSelector
                canAddSkills={userDetails?.status === "ACTIVE"}
                isShowLabel={true}
                style={styles.skillsContainer}
                userSkills={userDetails?.skills}
                handleAddSkill={mutationAddSkills?.mutate}
                handleRemoveSkill={mutationRemoveSkill?.mutate}
                availableSkills={WORKERTYPES}
              />
              <UserInfoComponent user={userDetails} />
              <WorkInformation
                information={userDetails?.workDetails}
                style={{ marginLeft: 0 }}
              />
              <View style={{ paddingTop: 12 }}>
                <ServiceInformation
                  information={userDetails?.serviceDetails}
                  style={{ marginLeft: 0 }}
                />
              </View>

              <JoinWhatsAppGroup
                groupLink="https://chat.whatsapp.com/E5IuGZ8EXJR5ZO490tlfoD?mode=gi_t"
                title={t("joinWhatsappGroupTitle")}
                description={t("joinWhatsappGroupDescription")}
                buttonText={t("joinWhatsappGroupButton")}
              />
              <FollowInstagram profileLink="https://instagram.com/apnarojgarindia" />
              {userDetails?.employedBy && (
                <TeamAdminCard admin={userDetails?.employedBy} />
              )}

              <CustomText style={styles.copyright}>
                © 2024 Apna Rojgar. All rights reserved.
              </CustomText>
            </View>
          </ScrollView>
        )}

        {/* ── Settings tab ── */}
        {selectedTab === "settings" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.contentSheet}>
              <ProfileMenu disabled={userDetails?.status !== "ACTIVE"} />
              <CustomText style={styles.copyright}>
                © 2024 Apna Rojgar. All rights reserved.
              </CustomText>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.primary,
  },
  /* Hero */
  heroCard: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: "center",
    gap: 8,
  },
  heroName: {
    color: Colors.white,
    marginTop: 4,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  rolePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  changeRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  actionBtnSolid: {
    backgroundColor: Colors.tertiery,
  },
  /* Tabs */
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.18)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 3,
    position: "relative",
  },
  tabItemActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 3,
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  /* Content sheet */
  contentSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    minHeight: 300,
  },
  formContainer: {
    paddingVertical: 20,
    gap: 20,
  },
  skillsContainer: {
    padding: 14,
    flexDirection: "column",
    marginBottom: 12,
    backgroundColor: "#F4F6FA",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8ECF4",
  },
  copyright: {
    marginVertical: 20,
    textAlign: "center",
  },
});
