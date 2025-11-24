"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const config_1 = __importDefault(require("../config"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
};
winston_1.default.addColors(logColors);
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? "\n" + info.stack : ""}`));
const transports = [
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), logFormat),
    }),
];
if (config_1.default.NODE_ENV === "production") {
    transports.push(new winston_1.default.transports.File({
        filename: "logs/error.log",
        level: "error",
        format: logFormat,
    }), new winston_1.default.transports.File({
        filename: "logs/combined.log",
        format: logFormat,
    }));
}
const logger = winston_1.default.createLogger({
    level: config_1.default.LOG_LEVEL,
    levels: logLevels,
    transports,
});
exports.default = logger;
