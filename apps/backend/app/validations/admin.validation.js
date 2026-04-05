import Joi from "joi";
import mongoose from "mongoose";

export const activateSuspendUserSchema = Joi.object({
  userId: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid MongoDB ObjectId");
      }
      return value;
    })
    .messages({
      "string.empty": "User ID is required",
      "any.required": "User ID is required",
    }),
});
