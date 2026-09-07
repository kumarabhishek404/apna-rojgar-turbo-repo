import logError from "../utils/addErrorLog.js";
import { understandSaathiUtterance } from "../utils/saathiNlu.js";

export const handleSaathiUnderstand = async (req, res) => {
  try {
    const utterance = String(req.body?.utterance || req.body?.message || "").trim();
    if (!utterance) {
      return res.status(400).json({
        success: false,
        message: "utterance is required",
      });
    }

    const role = String(req.body?.role || req.user?.role || "WORKER").toUpperCase();
    const locale = String(req.body?.locale || "hi");
    const slots =
      req.body?.slots && typeof req.body.slots === "object" ? req.body.slots : {};

    try {
      const understood = await understandSaathiUtterance({
        utterance,
        role,
        locale,
        slots,
        history: Array.isArray(req.body?.history) ? req.body.history : [],
      });
      if (understood) {
        return res.status(200).json({
          success: true,
          data: understood,
        });
      }
    } catch (nluError) {
      console.warn("[saathi] Gemini NLU failed, client will use rules:", nluError?.message);
    }

    return res.status(200).json({
      success: true,
      data: null,
      fallback: "rules",
    });
  } catch (error) {
    logError(error, req, 500, "saathi.understand", { skipAdminNotify: true });
    return res.status(200).json({
      success: true,
      data: null,
      fallback: "rules",
    });
  }
};
