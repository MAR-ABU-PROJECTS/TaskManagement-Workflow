"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
exports.generateId = generateId;
const uuid_1 = require("uuid");
exports.users = [];
function generateId() {
    return (0, uuid_1.v4)();
}
