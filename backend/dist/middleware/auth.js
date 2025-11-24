"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const token_1 = require("../utils/token");
const prisma_1 = __importDefault(require("../db/prisma"));
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Token missing" });
    }
    const decoded = (0, token_1.verifyToken)(token);
    if (!decoded) {
        return res.status(401).json({ message: "Invalid token" });
    }
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ message: "User not found or inactive" });
        }
        req.user = user;
        return next();
    }
    catch (error) {
        return next(error);
    }
}
function authorize(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return next();
    };
}
