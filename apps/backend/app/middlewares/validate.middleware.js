const validate = (schema) => {
  return (req, res, next) => {
    console.log(req.body, "validate");
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    next();
  };
};

export default validate;
