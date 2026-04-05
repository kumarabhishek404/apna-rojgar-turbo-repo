import Joi from "joi";
export const loginSchema = Joi.object({
  mobile: Joi.string().required().messages({
    "string.empty": "Mobile number is required",
    "any.required": "Mobile number is required",
  })
});

export const registerSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "First name is required",
    "any.required": "First name is required",
  }),
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "any.required": "Mobile number is required",
      "string.pattern.base": "Mobile number must be 10 digits",
    }),
  // email: Joi.string().email().required().messages({
  //   "string.empty": "Email is required",
  //   "any.required": "Email is required",
  //   "string.email": "Invalid email format",
  // }),
  address: Joi.string().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),
  gender: Joi.string().valid("male", "female", "other").required().messages({
    "any.only": "Gender must be male, female, or other",
    "any.required": "Gender is required",
  }),
  dateOfBirth: Joi.required().messages({
    "date.base": "Invalid date format",
    "any.required": "Date of birth is required",
  }),
  password: Joi.string().length(4).required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
    "string.min": "Password must be at least 4 characters long",
  }),
});

export const sendEmailVerificationCodeSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
});

export const verifyEmailVerificationCodeSchema = Joi.object({
  code: Joi.string().required().messages({
    "string.empty": "Code is required",
    "any.required": "Code is required",
  }),
});
