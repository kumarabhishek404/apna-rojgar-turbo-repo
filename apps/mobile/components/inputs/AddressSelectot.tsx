import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import Colors from "@/constants/Colors";
import CustomHeading from "../commons/CustomHeading";
import CustomText from "../commons/CustomText";
import AddAddressDrawer from "@/app/screens/location/addAddress";
import { t } from "@/utils/translationHelper";
import PaperDropdown from "./Dropdown";

interface Props {
  label: string;
  address: string;
  setAddress: (val: string) => void;
  setLocation: (loc: any) => void;
  errors?: any;
}

const AddressSelector = ({
  label,
  address,
  setAddress,
  setLocation,
  errors,
}: Props) => {
  const user = useAtomValue(Atoms?.UserAtom);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);

  useEffect(() => {
    const mainAddress = user?.address?.trim();
    const savedAddresses = Array.isArray(user?.savedAddresses)
      ? user.savedAddresses
      : [];
    const merged = Array.from(
      new Set([...(mainAddress ? [mainAddress] : []), ...savedAddresses]),
    ).filter(Boolean) as string[];

    setAddresses(merged);

    // Default to profile main address on create-service step.
    if (!address && merged.length > 0) {
      setAddress(mainAddress || merged[0]);
    }
  }, [user?.address, user?.savedAddresses, address, setAddress]);

  const selectAddress = (addr: string) => {
    setAddress(addr);
  };

  const addressOptions = addresses.map((addr) => ({
    label: addr,
    value: addr,
  }));

  return (
    <View style={{ gap: 10 }}>
      <CustomHeading baseFont={18} textAlign="left">
        {label}
      </CustomHeading>

      {/* Saved Address Input */}
      {addresses.length > 1 ? (
        <PaperDropdown
          name="address"
          label=""
          options={addressOptions}
          selectedValue={address}
          onSelect={selectAddress}
          placeholder={t("selectWorkLocation")}
          searchEnabled
        />
      ) : (
        addresses.map((addr, index) => {
          const selected = address === addr;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.card, selected && styles.activeCard]}
              onPress={() => selectAddress(addr)}
            >
              <View style={[styles.radio, selected && styles.radioActive]} />
              <CustomText
                style={{ flex: 1 }}
                textAlign="left"
                color={selected ? Colors.primary : Colors.text}
              >
                {addr}
              </CustomText>
            </TouchableOpacity>
          );
        })
      )}

      {/* Add new address button */}
      <TouchableOpacity
        style={styles.addNewBtn}
        onPress={() => setDrawerVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
        <CustomText color={Colors.primary}>{t("addNewAddress")}</CustomText>
      </TouchableOpacity>

      <AddAddressDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        userId={user?._id}
        type="secondary"
        isMainAddress={false}
        setAddress={(data: any) => {
          const selected =
            typeof data === "string" ? data : data?.address || "";
          if (selected) {
            setAddress(selected);
          }
        }}
        setSavedAddress={(saved: string[]) => {
          const unique = Array.from(new Set(saved || []));
          setAddresses(unique);
          if (unique.length > 0 && !address) {
            setAddress(unique[unique.length - 1]);
          }
        }}
        setLocation={setLocation}
      />

      {errors && (
        <CustomText color={Colors.danger}>{errors.message}</CustomText>
      )}
    </View>
  );
};

export default AddressSelector;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 10,
  },
  activeCard: {
    borderColor: Colors.primary,
    backgroundColor: "#F1F8FF",
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#aaa",
  },
  radioActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
});
