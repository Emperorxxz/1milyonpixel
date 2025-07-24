const Joi = require('joi');

const pixelValidation = Joi.object({
  coordinates: Joi.object({
    x: Joi.number().integer().min(0).max(990).required(),
    y: Joi.number().integer().min(0).max(990).required()
  }).required(),
  size: Joi.object({
    width: Joi.number().integer().min(10).max(100).default(10),
    height: Joi.number().integer().min(10).max(100).default(10)
  }),
  owner: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().max(50)
  }).required()
});

module.exports = (req, res, next) => {
  const { error } = pixelValidation.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};