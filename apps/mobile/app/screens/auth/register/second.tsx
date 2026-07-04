import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Colors from "@/constants/Colors";
import Button from "@/components/inputs/Button";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import EmailAddressField from "@/components/inputs/EmailAddress";
import AddLocationAndAddress from "@/components/commons/AddLocationAndAddress";
import { Controller, useForm } from "react-hook-form";
import { isEmptyObject } from "@/constants/functions";
import { t } from "@/utils/translationHelper";
import DateField from "@/components/inputs/DateField";
import Gender from "@/components/inputs/Gender";
import moment, { Moment } from "moment";
import { router, Stack, useLocalSearchParams } from "expo-router";
import TextInputComponent from "@/components/inputs/TextInputWithIcon";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import USER from "@/app/api/user";
import TOAST from "@/app/hooks/toast";
import { useMutation } from "@tanstack/react-query";
import Loader from "@/components/commons/Loaders/Loader";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import AutoLocationButton from "@/components/inputs/CurrentLocation";

const SecondScreen = () => {
  const userDetails = useAtomValue(Atoms?.UserAtom);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: userDetails?.name || "",
      address: userDetails?.address || "",
      email: userDetails?.email || "",
      gender: userDetails?.gender || "",
      age: userDetails?.age || "",
      aadhaarNumber: userDetails?.aadhaarNumber || "",
    },
  });
  const [location, setLocation] = useState<any>({});
  const [savedAddress, setSavedAddress] = useState<any>([]);
  const { userId } = useLocalSearchParams();

  const mutationUpdateProfile = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: (payload: any) =>
      USER.updateUserById({
        _id: userId,
        ...payload,
      }),
    onSuccess: () => {
      console.log("Profile updated successfully");
      TOAST?.success(t("userDetailsAddedSuccessfully"));
      router.push({
        pathname: "/screens/auth/register/fourth",
        params: { userId: userId },
      });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
    },
  });

  const onSubmit = (data: any) => {
    console.log("data--", data);

    mutationUpdateProfile.mutate({
      name: data?.name,
      age: Number(data?.age),
      aadhaarNumber: data?.aadhaarNumber,
      geoLocation: location,
      savedAddresses: data?.address,
      address: data?.address ?? "",
      email: data?.email,
      gender: data?.gender,
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Loader loading={mutationUpdateProfile?.isPending} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="person-circle-outline"
                size={54}
                color={Colors.primary}
              />
            </View>
            <CustomHeading
              baseFont={26}
              color={Colors.primary}
              style={styles.headerTitle}
            >
              {t("personalDetails")}
            </CustomHeading>
            <CustomText
              baseFont={14}
              color={Colors.secondary}
              textAlign="center"
              style={styles.headerSubtitle}
            >
              {t("pleaseEnterYourPersonalDetailsToContinue")}
            </CustomText>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formFields}>
                {/* Name Field - Required */}
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: t("firstNameIsRequired") }}
                  render={({ field: { onChange, value } }) => (
                    <TextInputComponent
                      name="name"
                      label="name"
                      value={value}
                      onChangeText={onChange}
                      placeholder={t("enterYourFirstName")}
                      inputStyle={styles.inputContainer}
                      textStyles={styles.inputText}
                      errors={errors}
                      isRequired={true}
                      icon={
                        <View style={styles.fieldIconBadge}>
                          <Ionicons
                            name="person-outline"
                            size={18}
                            color={Colors.primary}
                          />
                        </View>
                      }
                    />
                  )}
                />

                {/* Address Field - Required */}

                <Controller
                  control={control}
                  name="address"
                  rules={{ required: t("addressIsRequired") }}
                  render={({ field: { onChange, value } }) => (
                    <AutoLocationButton
                      label="address"
                      name="address"
                      address={value}
                      setAddress={onChange}
                      location={location}
                      setLocation={setLocation}
                      savedAddress={savedAddress}
                      setSavedAddress={setSavedAddress}
                      errors={errors}
                      isRequired={true}
                    />
                  )}
                />

                {/* Email Field */}
                {/* <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <EmailAddressField
                    name="email"
                    email={value}
                    setEmail={onChange}
                    placeholder={t("enterYourEmailAddress")}
                    icon={
                      <Ionicons
                        name={"mail-outline"}
                        size={30}
                        color={Colors.secondary}
                        style={{ paddingVertical: 10, marginRight: 10 }}
                      />
                    }
                    errors={errors}
                  />
                )}
              /> */}

                {/* Date of Birth Field */}
                {/* <View style={{ marginTop: 10 }}>
              <Controller
                control={control}
                name="dateOfBirth"
                rules={{
                  required: t("dateOfBirthIsRequired"),
                  validate: (value) => {
                    const selectedDate = moment(value);
                    const eighteenYearsAgo = moment().subtract(18, "years");

                    return selectedDate.isBefore(eighteenYearsAgo)
                      ? true
                      : t("youMustBeAtLeast18YearsOld");
                  },
                }}
                render={({ field: { onChange, value } }) => (
                  <DateField
                    title={t("dateOfBirth")}
                    name="dateOfBirth"
                    type="dateOfBirth"
                    date={moment(value)}
                    setDate={onChange}
                    errors={errors}
                  />
                )}
              />
            </View> */}

                {/* Gender Selection */}
                <Controller
                  control={control}
                  name="gender"
                  rules={{ required: t("genderIsRequired") }}
                  render={({ field: { onChange, value } }) => (
                    <Gender
                      name="gender"
                      label={t("whatIsYourGender")}
                      options={[
                        { title: t("male"), value: "male", icon: "👨" },
                        { title: t("female"), value: "female", icon: "👩‍🦰" },
                        { title: t("other"), value: "other", icon: "✨" },
                      ]}
                      gender={value}
                      setGender={onChange}
                      containerStyle={errors?.gender && styles.errorInput}
                      errors={errors}
                      isRequired={true}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="age"
                  rules={{
                    required: t("ageIsRequired"),
                    validate: (value) =>
                      Number(value) >= 18 || t("youMustBeAtLeast18YearsOld"),
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInputComponent
                      name="age"
                      label="age"
                      value={value}
                      onChangeText={onChange}
                      placeholder={t("enterYourAge")}
                      type="number"
                      maxLength={2}
                      inputStyle={styles.inputContainer}
                      textStyles={styles.inputText}
                      errors={errors}
                      isRequired={true}
                      icon={
                        <View style={styles.fieldIconBadge}>
                          <Ionicons
                            name="calendar-outline"
                            size={18}
                            color={Colors.primary}
                          />
                        </View>
                      }
                    />
                  )}
                />

                {/* <Controller
                control={control}
                name="aadhaarNumber"
                render={({ field: { onChange, value } }) => (
                  <TextInputComponent
                    name="aadhaarNumber"
                    label="aadhaarNumber"
                    value={value}
                    onChangeText={(text) =>
                      onChange(text.replace(/[^0-9]/g, ""))
                    }
                    placeholder="XXXX XXXX XXXX"
                    type="numeric"
                    maxLength={12}
                    errors={errors}
                  />
                )}
              /> */}
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              isPrimary={true}
              title={t("back")}
              onPress={() => router.back()}
              bgColor={Colors.danger}
              borderColor={Colors.danger}
              style={styles.backButton}
              textStyle={styles.buttonText}
            />
            <Button
              isPrimary={true}
              title={t("saveAndNext")}
              onPress={handleSubmit(onSubmit)}
              bgColor={Colors.success}
              borderColor={Colors.success}
              style={styles.nextButton}
              textStyle={styles.buttonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.fourth,
    paddingHorizontal: 18,
    paddingTop: 42,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  headerIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.12)",
  },
  headerTitle: {
    lineHeight: 32,
  },
  headerSubtitle: {
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  formCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4EAF5",
    shadowColor: "#0F2E6E",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  formFields: {
    width: "100%",
    gap: 16,
  },
  inputContainer: {
    height: 58,
    borderRadius: 16,
    borderColor: "#DDE6F5",
    backgroundColor: "#F8FAFF",
    paddingLeft: 12,
  },
  inputText: {
    fontSize: 16,
    color: Colors.heading,
    fontWeight: "700",
  },
  fieldIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 14,
  },
  backButton: {
    width: "32%",
    minHeight: 56,
    borderRadius: 16,
  },
  nextButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    shadowColor: Colors.success,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "800",
  },
  errorInput: {
    borderWidth: 1,
    borderColor: "red",
  },
});

export default SecondScreen;
