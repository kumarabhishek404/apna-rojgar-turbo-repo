import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import Colors from "@/constants/Colors";
import Button from "../inputs/Button";
import CustomText from "./CustomText";
import ModalComponent from "./Modal";
import { useMutation } from "@tanstack/react-query";
import USER from "@/app/api/user";
import Atoms from "@/app/AtomStore";
import { useAtom, useSetAtom } from "jotai";
import { Controller, useForm } from "react-hook-form";
import TextInputComponent from "../inputs/TextInputWithIcon";
import { Ionicons } from "@expo/vector-icons";
import { t } from "@/utils/translationHelper";
import AddLocationAndAddress from "./AddLocationAndAddress";
import Gender from "../inputs/Gender";
import { isEmptyObject, getMissingCoreProfileFields } from "@/constants/functions";
import Loader from "./Loaders/Loader";
import REFRESH_USER from "@/app/hooks/useRefreshUser";
import * as ImagePicker from "expo-image-picker";
import { normalizePickedImageUriForUpload } from "@/utils/normalizePickedImageUriForUpload";
import TOAST from "@/app/hooks/toast";

function isFormDataPayload(p: unknown): p is FormData {
  return (
    p != null &&
    typeof p === "object" &&
    typeof (p as FormData).append === "function"
  );
}

const ProfileNotification: React.FC = () => {
  const [isCompleteProfileModel, setIsCompleteProfileModel] = useState(false);
  const [pickedProfileUri, setPickedProfileUri] = useState<string | null>(null);
  const setDrawerState: any = useSetAtom(Atoms?.SideDrawerAtom);
  const [location, setLocation] = useState<any>({});
  const [selectedOption, setSelectedOption] = useState(
    !isEmptyObject(location) ? "currentLocation" : "address",
  );
  const { refreshUser, isLoading } = REFRESH_USER.useRefreshUser();

  const [userDetails, setUserDetails] = useAtom(Atoms?.UserAtom);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: userDetails?.name || "",
      age: userDetails?.age != null ? String(userDetails.age) : "",
      mobile: userDetails?.mobile != null ? String(userDetails.mobile) : "",
      address: userDetails?.address || "",
      location: userDetails?.location || {},
      gender: userDetails?.gender || "",
    },
  });

  useEffect(() => {
    setValue("name", userDetails?.name || "");
    setValue("age", userDetails?.age != null ? String(userDetails.age) : "");
    setValue("mobile", userDetails?.mobile != null ? String(userDetails.mobile) : "");
    setValue("address", userDetails?.address || "");
    setValue("location", userDetails?.location || {});
    setValue("gender", userDetails?.gender || "");
  }, [isCompleteProfileModel, userDetails, setValue]);

  const mutationUpdateProfileInfo = useMutation({
    mutationKey: ["completeProfile"],
    mutationFn: (payload: Record<string, string> | FormData) => {
      if (isFormDataPayload(payload)) {
        return USER?.updateUserById(payload);
      }
      return USER?.updateUserById({
        _id: userDetails?._id,
        ...payload,
      });
    },
    onSuccess: (response) => {
      const user = response?.data?.data;
      setPickedProfileUri(null);
      refreshUser();
      if (user && typeof user === "object") {
        setUserDetails({
          ...userDetails,
          ...user,
        });
      }
      setDrawerState({ visible: false });
    },
    onError: (err) => {
      console.error("error while updating the profile ", err);
      setIsCompleteProfileModel(false);
    },
  });

  const pickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        TOAST.error(t("galleryPermissionRequired"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const uri = await normalizePickedImageUriForUpload(result.assets[0].uri);
        setPickedProfileUri(uri);
      }
    } catch (e) {
      console.warn(e);
      TOAST.error(t("somethingWentWrong"));
    }
  };

  const trim = (v: unknown) =>
    v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();

  const onSubmitCompleteProfile = (data: {
    name?: string;
    age?: string;
    mobile?: string;
    address?: string;
    gender?: string;
  }) => {
    const missing = getMissingCoreProfileFields(
      userDetails as Record<string, unknown>,
    );
    const updates: Record<string, string> = {};

    if (missing.has("name")) {
      const v = trim(data.name);
      if (!v) {
        TOAST.error(t("firstNameIsRequired"));
        return;
      }
      if (v !== trim(userDetails?.name)) updates.name = v;
    }

    if (missing.has("age")) {
      const v = trim(data.age);
      if (!v) {
        TOAST.error(t("ageIsRequired"));
        return;
      }
      if (v !== trim(userDetails?.age)) updates.age = v;
    }

    if (missing.has("mobile")) {
      const v = trim(data.mobile);
      if (!v) {
        TOAST.error(t("mobileIsRequired"));
        return;
      }
      if (v !== trim(userDetails?.mobile)) updates.mobile = v;
    }

    if (missing.has("address")) {
      const v = trim(data.address);
      if (!v) {
        TOAST.error(t("addressIsRequired"));
        return;
      }
      if (v !== trim(userDetails?.address)) updates.address = v;
    }

    if (missing.has("gender")) {
      const v = trim(data.gender);
      if (!v) {
        TOAST.error(t("genderIsRequired"));
        return;
      }
      if (v !== trim(userDetails?.gender)) updates.gender = v;
    }

    const hasPhotoPick = Boolean(pickedProfileUri);

    if (Object.keys(updates).length === 0 && !hasPhotoPick) {
      if (missing.has("profilePicture")) {
        TOAST.error(t("pleaseSelectAProfilePicture"));
      } else {
        TOAST.error(t("makeChangesToSave"));
      }
      return;
    }

    if (hasPhotoPick && pickedProfileUri) {
      const fd = new FormData();
      fd.append("_id", String(userDetails?._id));
      Object.entries(updates).forEach(([k, v]) => fd.append(k, v));
      const uri = pickedProfileUri;
      fd.append("profileImage", {
        uri: Platform.OS === "android" ? uri : uri.replace(/^file:\/\//, ""),
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);
      mutationUpdateProfileInfo.mutate(fd);
      return;
    }

    mutationUpdateProfileInfo.mutate(updates);
  };

  const completeProfileModalContent = () => {
    const missing = getMissingCoreProfileFields(
      userDetails as Record<string, unknown>,
    );

    return (
      <View style={styles.formContainer}>
        <View style={{ flexDirection: "column", gap: 25 }}>
          {missing.has("role") && (
            <CustomText baseFont={15} color={Colors.secondary}>
              {t("completeProfileRoleHint")}
            </CustomText>
          )}

          {missing.has("name") && (
            <Controller
              control={control}
              name="name"
              rules={{ required: t("firstNameIsRequired") }}
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
          )}

          {missing.has("age") && (
            <Controller
              control={control}
              name="age"
              rules={{ required: t("ageIsRequired") }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInputComponent
                  label="age"
                  name="age"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("age")}
                  type="number"
                  errors={errors}
                  icon={
                    <Ionicons
                      name="calendar-outline"
                      size={30}
                      color={Colors.secondary}
                      style={{ paddingVertical: 10, paddingRight: 10 }}
                    />
                  }
                />
              )}
            />
          )}

          {missing.has("mobile") && (
            <Controller
              control={control}
              name="mobile"
              rules={{ required: t("mobileIsRequired") }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInputComponent
                  label="mobile"
                  name="mobile"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={t("mobile")}
                  errors={errors}
                  icon={
                    <Ionicons
                      name="call-outline"
                      size={30}
                      color={Colors.secondary}
                      style={{ paddingVertical: 10, paddingRight: 10 }}
                    />
                  }
                />
              )}
            />
          )}

          {missing.has("address") && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Controller
                control={control}
                name="address"
                rules={{ required: t("addressIsRequired") }}
                render={({ field: { onChange, value } }) => (
                  <AddLocationAndAddress
                    label={t("address")}
                    name="address"
                    address={value}
                    setAddress={onChange}
                    location={location}
                    setLocation={setLocation}
                    selectedOption={selectedOption}
                    errors={errors}
                  />
                )}
              />
            </View>
          )}

          {missing.has("gender") && (
            <Controller
              control={control}
              name="gender"
              rules={{ required: t("genderIsRequired") }}
              render={({ field: { onChange, value } }) => (
                <Gender
                  name="gender"
                  label={t("whatIsYourGender")}
                  options={[
                    { title: t("male"), value: "male", icon: "👩‍🦰" },
                    { title: t("female"), value: "female", icon: "👨" },
                    { title: t("other"), value: "other", icon: "✨" },
                  ]}
                  gender={value}
                  setGender={onChange}
                  errors={errors}
                />
              )}
            />
          )}

          {missing.has("profilePicture") && (
            <View style={{ gap: 12 }}>
              <CustomText baseFont={15} color={Colors.secondary}>
                {t("completeProfilePhotoHint")}
              </CustomText>
              {pickedProfileUri ? (
                <Image
                  source={{ uri: pickedProfileUri }}
                  style={styles.previewImage}
                />
              ) : null}
              <TouchableOpacity onPress={pickProfilePhoto} activeOpacity={0.8}>
                <CustomText color={Colors.primary} fontWeight="600">
                  {t("chooseFromGallery")}
                </CustomText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleCompleteProfile = () => {
    setDrawerState({
      visible: true,
      title: "completeProfile",
      content: completeProfileModalContent,
      primaryButton: {
        title: "save",
        action: handleSubmit(onSubmitCompleteProfile),
      },
      secondaryButton: {
        title: "cancel",
        action: () => setDrawerState({ visible: false }),
      },
    });
  };

  return (
    <View style={styles.notificationContainer}>
      <Loader loading={mutationUpdateProfileInfo?.isPending || isLoading} />
      <CustomText
        textAlign="left"
        baseFont={16}
        color={Colors?.white}
        fontWeight="600"
        style={styles?.text}
      >
        {t("completeYourProfileToUnlockAllFeatures")}
      </CustomText>
      <Button
        isPrimary={true}
        title={t("completeProfile")}
        onPress={handleCompleteProfile}
        style={styles.completeButton}
        textStyle={{ fontSize: 18 }}
      />

      <ModalComponent
        visible={isCompleteProfileModel}
        title={t("completeProfile")}
        onClose={() => setIsCompleteProfileModel(false)}
        content={completeProfileModalContent}
        primaryButton={{
          action: handleSubmit(onSubmitCompleteProfile),
        }}
        secondaryButton={{
          action: () => setIsCompleteProfileModel(false),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    backgroundColor: Colors.tertiery,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 20,
    flexDirection: "row",
    borderRadius: 8,
  },
  text: {
    flex: 1,
  },
  completeButton: {
    width: "40%",
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  completeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  formContainer: {
    paddingVertical: 20,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    backgroundColor: Colors.inputBorder,
  },
});

export default ProfileNotification;
