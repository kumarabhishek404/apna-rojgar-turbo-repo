import SERVICETRANSLATION from "./service.translation.js";

const englishSkillLabels = SERVICETRANSLATION.service.en;

/** Labels for skills not yet present in service.translation.js */
const SUPPLEMENTAL_SKILL_LABELS = {
  customerServiceAssistant: "Customer Work Assistant",
  inventoryTaker: "Inventory Taker",
  glassFitter: "Glass Fitter",
  tileLayer: "Tile Layer",
  mason: "Mason",
  masons: "Mason",
  marbleFitter: "Marble Fitter",
  helperLabour: "Helper Labour",
  barBender: "Bar Bender",
  scaffoldingMistri: "Scaffolding Mistri",
  beldaarConstruction: "Beldaar",
  farmConsultant: "Farm Consultant",
  waterDistribution: "Water Distribution Worker",
};

const humanizeSkillKey = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getSkillLabel = (skillKey) => {
  const key = String(skillKey ?? "").trim();
  if (!key) return "";

  return (
    englishSkillLabels[key] ||
    SUPPLEMENTAL_SKILL_LABELS[key] ||
    humanizeSkillKey(key)
  );
};

/** Alias: same lookup map covers work types, sub types, and worker skills. */
export const getWorkTypeLabel = getSkillLabel;

const extractSkillKey = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.skill || item.name || item.value || item.label || "";
};

export const formatSkillLabels = (skills = []) =>
  skills
    .map((item) => getSkillLabel(extractSkillKey(item)))
    .filter(Boolean)
    .join(", ");
