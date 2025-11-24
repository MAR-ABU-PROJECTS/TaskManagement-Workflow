"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JQLController_1 = __importDefault(require("../controllers/JQLController"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get("/search", (0, rbac_1.hasProjectPermission)(enums_1.Permission.BROWSE_PROJECT), JQLController_1.default.searchWithJQL);
router.post("/validate", JQLController_1.default.validateJQL);
router.get("/suggestions", JQLController_1.default.getJQLSuggestions);
exports.default = router;
