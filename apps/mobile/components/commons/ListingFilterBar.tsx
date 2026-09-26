import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";
import CustomHeading from "@/components/commons/CustomHeading";
import { t } from "@/utils/translationHelper";
import { getDynamicWorkerType } from "@/utils/i18n";

export type CityOption = {
  city: string;
  count: number;
};

export type SkillOption = {
  /** Stored slug, e.g. `tileMistri`. */
  skill: string;
  count: number;
};

export type ListingFilterBarVariant = "default" | "onDark";

type SelectOption = {
  value: string;
  label: string;
  count: number;
};

type Props = {
  cities: CityOption[];
  /** Empty string means “all cities”. */
  selectedCity: string;
  onSelectCity: (city: string) => void;
  /** Omit to render the city dropdown on its own. */
  skills?: SkillOption[];
  /** Empty string means “all skills”. */
  selectedSkill?: string;
  onSelectSkill?: (skill: string) => void;
  onPressFilter: () => void;
  showFilterButton?: boolean;
  isLoading?: boolean;
  skillsLoading?: boolean;
  /** Sheet title, e.g. `selectCityForWork`. */
  titleKey?: string;
  skillTitleKey?: string;
  style?: ViewStyle;
  /** Use on blue / gradient headers: high-contrast filter control. */
  variant?: ListingFilterBarVariant;
};

/** Beyond this many options the sheet gets its own lookup field. */
const LOOKUP_THRESHOLD = 8;

/** Shared by every control so the row reads as one unit and never changes height. */
const CONTROL_HEIGHT = 46;

type SelectProps = {
  options: SelectOption[];
  selected: string;
  onSelect: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrowKey: string;
  allLabelKey: string;
  titleKey: string;
  lookupPlaceholderKey: string;
  emptyKey: string;
  isLoading: boolean;
  dark: boolean;
};

/** A pill that opens a bottom sheet of counted options. */
const FilterSelect = ({
  options,
  selected,
  onSelect,
  icon,
  eyebrowKey,
  allLabelKey,
  titleKey,
  lookupPlaceholderKey,
  emptyKey,
  isLoading,
  dark,
}: SelectProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lookup, setLookup] = useState("");

  useEffect(() => {
    if (!sheetOpen) setLookup("");
  }, [sheetOpen]);

  const withAllOption = useMemo<SelectOption[]>(
    () => [
      {
        value: "",
        label: t(allLabelKey),
        count: options.reduce((sum, option) => sum + (option.count || 0), 0),
      },
      ...options,
    ],
    [options, allLabelKey],
  );

  const visibleOptions = useMemo(() => {
    const query = lookup.trim().toLowerCase();
    if (!query) return withAllOption;
    return withAllOption.filter(
      (option) => !option.value || option.label.toLowerCase().includes(query),
    );
  }, [withAllOption, lookup]);

  const showLookup = options.length > LOOKUP_THRESHOLD;
  const activeOption = options.find((option) => option.value === selected);
  const hasSelection = Boolean(selected);
  const label = activeOption?.label || (hasSelection ? selected : t(allLabelKey));

  const handleSelect = (value: string) => {
    onSelect(value);
    setSheetOpen(false);
  };

  const renderOption = ({ item }: { item: SelectOption }) => {
    const active = item.value === selected;
    return (
      <Pressable
        onPress={() => handleSelect(item.value)}
        style={[styles.option, active && styles.optionActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <View style={[styles.optionIcon, active && styles.optionIconActive]}>
          <Ionicons
            name={item.value ? icon : "apps-outline"}
            size={16}
            color={active ? Colors.white : Colors.primary}
          />
        </View>
        <CustomText
          baseFont={15}
          fontWeight={active ? "700" : "500"}
          textAlign="left"
          numberOfLines={1}
          color={active ? Colors.primary : Colors.text}
          style={styles.optionLabel}
        >
          {item.label}
        </CustomText>
        <View style={[styles.countPill, active && styles.countPillActive]}>
          <CustomText
            baseFont={12}
            fontWeight="700"
            color={active ? Colors.white : "rgba(34, 64, 154, 0.75)"}
          >
            {String(item.count ?? 0)}
          </CustomText>
        </View>
        {active ? (
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        ) : null}
      </Pressable>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t(titleKey)}
        accessibilityValue={{ text: label }}
        style={[
          styles.selectShell,
          dark && styles.selectShellOnDark,
          hasSelection && styles.selectShellSelected,
        ]}
      >
        <View style={styles.labelBlock}>
          <View style={styles.eyebrowRow}>
            <Ionicons
              name={icon}
              size={11}
              color={hasSelection ? Colors.primary : "rgba(34, 64, 154, 0.55)"}
            />
            <CustomText
              baseFont={10}
              fontWeight="700"
              textAlign="left"
              numberOfLines={1}
              color={hasSelection ? Colors.primary : "rgba(34, 64, 154, 0.55)"}
              style={styles.eyebrow}
            >
              {t(eyebrowKey)}
            </CustomText>
          </View>
          <CustomText
            baseFont={14}
            fontWeight="700"
            textAlign="left"
            numberOfLines={1}
            color={Colors.text}
          >
            {label}
          </CustomText>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons
            name="chevron-down"
            size={16}
            color="rgba(34, 64, 154, 0.55)"
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSheetOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t("close")}
        />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <CustomHeading
              baseFont={18}
              fontWeight="bold"
              textAlign="left"
              color={Colors.heading}
              style={styles.sheetTitle}
            >
              {t(titleKey)}
            </CustomHeading>
            <TouchableOpacity
              onPress={() => setSheetOpen(false)}
              style={styles.sheetClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t("close")}
            >
              <Ionicons name="close" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {showLookup ? (
            <View style={styles.lookupShell}>
              <Ionicons
                name="search-outline"
                size={18}
                color="rgba(34, 64, 154, 0.45)"
              />
              <TextInput
                value={lookup}
                onChangeText={setLookup}
                placeholder={t(lookupPlaceholderKey)}
                placeholderTextColor="rgba(90, 90, 90, 0.55)"
                style={styles.lookupInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>
          ) : null}

          <FlatList
            data={visibleOptions}
            keyExtractor={(item) => item.value || "__all__"}
            renderItem={renderOption}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetList}
            ListEmptyComponent={
              <CustomText
                baseFont={14}
                color="rgba(44, 44, 44, 0.6)"
                style={styles.emptyLabel}
              >
                {isLoading ? t("loading") : t(emptyKey)}
              </CustomText>
            }
          />
        </View>
      </Modal>
    </>
  );
};

const ListingFilterBar = ({
  cities,
  selectedCity,
  onSelectCity,
  skills,
  selectedSkill = "",
  onSelectSkill,
  onPressFilter,
  showFilterButton = true,
  isLoading = false,
  skillsLoading = false,
  titleKey = "selectCity",
  skillTitleKey = "selectSkill",
  style,
  variant = "default",
}: Props) => {
  const dark = variant === "onDark";
  const showSkills = Array.isArray(skills) && typeof onSelectSkill === "function";

  const cityOptions = useMemo<SelectOption[]>(
    () =>
      cities.map((option) => ({
        value: option.city,
        label: option.city,
        count: option.count,
      })),
    [cities],
  );

  // Skills are stored as slugs, so the sheet shows (and searches) translations.
  const skillOptions = useMemo<SelectOption[]>(
    () =>
      (skills || []).map((option) => ({
        value: option.skill,
        label: getDynamicWorkerType(option.skill, 1),
        count: option.count,
      })),
    [skills],
  );

  return (
    <View style={[styles.row, style]}>
      <FilterSelect
        options={cityOptions}
        selected={selectedCity}
        onSelect={onSelectCity}
        icon="location-sharp"
        eyebrowKey="city"
        allLabelKey="allCities"
        titleKey={titleKey}
        lookupPlaceholderKey="findCity"
        emptyKey="noCitiesAvailable"
        isLoading={isLoading}
        dark={dark}
      />

      {showSkills ? (
        <FilterSelect
          options={skillOptions}
          selected={selectedSkill}
          onSelect={onSelectSkill!}
          icon="construct"
          eyebrowKey="skill"
          allLabelKey="allSkills"
          titleKey={skillTitleKey}
          lookupPlaceholderKey="findSkill"
          emptyKey="noSkillsAvailable"
          isLoading={skillsLoading}
          dark={dark}
        />
      ) : null}

      {showFilterButton ? (
        <TouchableOpacity
          onPress={onPressFilter}
          style={[
            styles.filterBtn,
            dark && styles.filterBtnOnDark,
            // With one dropdown there is room to label the button.
            !showSkills && styles.filterBtnWide,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("filter")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={dark ? Colors.white : Colors.primary}
          />
          {!showSkills ? (
            <CustomText
              fontWeight="700"
              baseFont={15}
              color={dark ? Colors.white : Colors.primary}
              style={dark ? styles.filterLabelOnDark : undefined}
            >
              {t("filter")}
            </CustomText>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  selectShell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 10,
    minWidth: 0,
    minHeight: CONTROL_HEIGHT,
    // Border is always present so selecting an option never shifts the row height.
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.12)",
    shadowColor: "#0a162e",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  selectShellOnDark: {
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
  },
  selectShellSelected: {
    borderColor: "rgba(34, 64, 154, 0.4)",
  },
  labelBlock: {
    flex: 1,
    minWidth: 0,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  eyebrow: {
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    // Matches the dropdowns so every control sits on the same baseline.
    minHeight: CONTROL_HEIGHT,
    minWidth: CONTROL_HEIGHT,
    paddingHorizontal: 10,
  },
  filterBtnWide: {
    minWidth: 118,
    paddingHorizontal: 18,
  },
  filterBtnOnDark: {
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  filterLabelOnDark: {
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 16, 38, 0.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "72%",
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(34, 64, 154, 0.18)",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sheetTitle: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 64, 154, 0.08)",
  },
  lookupShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.18)",
    backgroundColor: "#f8faff",
    paddingHorizontal: 12,
    minHeight: 44,
    marginBottom: 10,
  },
  lookupInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  sheetList: {
    paddingBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 6,
    backgroundColor: "#f8faff",
  },
  optionActive: {
    backgroundColor: "#e8eeff",
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.3)",
  },
  optionIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 64, 154, 0.1)",
  },
  optionIconActive: {
    backgroundColor: Colors.primary,
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
  },
  countPill: {
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(34, 64, 154, 0.1)",
  },
  countPillActive: {
    backgroundColor: Colors.primary,
  },
  emptyLabel: {
    paddingVertical: 24,
  },
});

export default ListingFilterBar;
