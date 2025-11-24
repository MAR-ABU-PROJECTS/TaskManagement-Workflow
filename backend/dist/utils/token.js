"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyToken = verifyToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
function generateToken(payload, expiresIn) {
    return jsonwebtoken_1.default.sign(payload, config_1.default.JWT_SECRET, {
        expiresIn: (expiresIn || config_1.default.JWT_EXPIRES_IN),
    });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.default.REFRESH_TOKEN_SECRET, {
        expiresIn: config_1.default.REFRESH_TOKEN_EXPIRES_IN,
    });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET);
    }
    catch (err) {
        return null;
    }
}
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.default.REFRESH_TOKEN_SECRET);
    }
    catch (err) {
        return null;
    }
}
