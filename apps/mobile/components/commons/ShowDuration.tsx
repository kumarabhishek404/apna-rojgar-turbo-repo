import { t } from "@/utils/translationHelper";
import React from "react";
import CustomText from "./CustomText";

interface ShowDurationProps {
  duration: number;
  alignment?: string;
  showLeadingEmoji?: boolean;
}

const ShowDuration: React.FC<ShowDurationProps> = ({
  duration,
  alignment,
  showLeadingEmoji = true,
}) => {
  return (
    <CustomText textAlign={alignment ? alignment : "left"}>
      {showLeadingEmoji ? "⏳  " : ""}
      {t("duration")} {duration} {duration > 1 ? t("days") : t("day")}
    </CustomText>
  );
};

export default ShowDuration;
