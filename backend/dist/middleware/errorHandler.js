"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = __importDefault(require("../utils/logger"));
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, _next) {
    let statusCode = 500;
    let message = "Internal server error";
    let errors;
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if ("code" in err && "meta" in err) {
        statusCode = 400;
        const prismaErr = err;
        if (prismaErr.code === "P2002") {
            const target = prismaErr.meta?.target || [];
            message = `${target.join(", ")} already exists`;
        }
        else if (prismaErr.code === "P2003") {
            message = "Related record not found";
        }
        else if (prismaErr.code === "P2025") {
            statusCode = 404;
            message = "Record not found";
        }
        else {
            message = "Database operation failed";
        }
    }
    else if (err.constructor.name === "PrismaClientValidationError") {
        statusCode = 400;
        message = "Invalid data provided";
    }
    logger_1.default.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    if (err.stack) {
        logger_1.default.error(err.stack);
    }
    res.status(statusCode).json({
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}
function notFoundHandler(req, res) {
    res.status(404).json({
        message: `Route ${req.originalUrl} not found`,
    });
}
