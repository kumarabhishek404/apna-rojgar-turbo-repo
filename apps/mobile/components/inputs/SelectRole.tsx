import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import CustomHeading from "../commons/CustomHeading";
import CustomText from "../commons/CustomText";
import { t } from "@/utils/translationHelper";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface RoleSelectionProps {
  role: string;
  setRole: any;
  resetSkills: () => void;
}
const RoleSelection = ({ role, setRole, resetSkills }: RoleSelectionProps) => {
  const roles = [
    {
      id: "WORKER",
      title: t("doWork"),
      description: t("workerDescription"),
      price: "$0.00",
    },
    {
      id: "MEDIATOR",
      title: t("beMediator"),
      description: t("mediatorDescription"),
      price: "$10.00",
    },
    {
      id: "EMPLOYER",
      title: t("giveWork"),
      description: t("employerDescription"),
      price: "$20.00",
    },
  ];

  const handleSelectRole = (selectedRole: any) => {
    if (role !== selectedRole.id) {
      resetSkills(); // ⭐ reset instantly
    }
    setRole(selectedRole.id);
  };

  return (
    <View style={styles.container}>
      {/* <CustomHeading textAlign="left">Select Your Role</CustomHeading> */}
      <View style={styles.roleContainer}>
        {roles.map((selectedRole, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            style={[
              styles.roleBox,
              role === selectedRole.id && styles.selectedRoleBox,
            ]}
            onPress={() => handleSelectRole(selectedRole)}
          >
            <View style={styles.roleContent}>
              <Ionicons
                name={
                  selectedRole.id === "WORKER"
                    ? "hammer-outline"
                    : selectedRole.id === "MEDIATOR"
                      ? "people-outline"
                      : "briefcase-outline"
                }
                size={18}
                color={role === selectedRole.id ? Colors.white : Colors.primary}
              />
              <CustomHeading
                baseFont={12}
                color={role === selectedRole.id ? Colors.white : Colors.primary}
              >
                {selectedRole.title}
              </CustomHeading>
            </View>
            <View
              style={[
                styles.radioCircle,
                role === selectedRole.id && styles.selectedRadio,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    gap: 5,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  roleBox: {
    flex: 1,
    minHeight: 86,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "#F8FAFF",
    borderRadius: 14,
    borderColor: "#DDE6F5",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedRoleBox: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  roleContent: {
    alignItems: "center",
    gap: 5,
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors?.disabledText,
    marginTop: 6,
    backgroundColor: Colors.white,
  },
  selectedRadio: {
    borderColor: Colors?.white,
    backgroundColor: Colors?.tertiery,
  },
});

export default RoleSelection;
