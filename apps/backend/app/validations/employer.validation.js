import Joi from "joi";
export const sendInvitationSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
  startDate: Joi.string().required().messages({
    "string.empty": "Start Date is required",
    "any.required": "Start Date is required",
  }),

  type: Joi.string().required().messages({
    "string.empty": "Type is required",
    "any.required": "Type is required",
  }),

  subType: Joi.string().required().messages({
    "string.empty": "Sub  Type is required",
    "any.required": "Sub Type  is required",
  }),
  duration: Joi.string().required().messages({
    "string.empty": "Duration is required",
    "any.required": "Duration  is required",
  }),
  description: Joi.string().required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),

  address: Joi.string().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  requiredNumberOfWorkers: Joi.string().required().optional().messages({
    "string.empty": "Required Number of  Workers is required",
    "any.required": "Required Number of  Workers is required",
  }),
});

export const cancelInvitationSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});

export const removeBookedUserSchema = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});
