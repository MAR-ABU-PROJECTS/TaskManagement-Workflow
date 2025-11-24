"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));
                return res.status(400).json({
                    message: "Validation failed",
                    errors,
                });
            }
            return next(error);
        }
    };
}
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));
                return res.status(400).json({
                    message: "Invalid query parameters",
                    errors,
                });
            }
            return next(error);
        }
    };
}
