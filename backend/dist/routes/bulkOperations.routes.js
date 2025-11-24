"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BulkOperationsController_1 = __importDefault(require("../controllers/BulkOperationsController"));
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const enums_1 = require("../types/enums");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/edit", (0, rbac_1.hasProjectPermission)(enums_1.Permission.EDIT_ISSUES), BulkOperationsController_1.default.bulkEdit);
router.post("/transition", (0, rbac_1.hasProjectPermission)(enums_1.Permission.TRANSITION_ISSUES), BulkOperationsController_1.default.bulkTransition);
router.post("/assign", (0, rbac_1.hasProjectPermission)(enums_1.Permission.ASSIGN_ISSUES), BulkOperationsController_1.default.bulkAssign);
router.post("/delete", (0, rbac_1.hasProjectPermission)(enums_1.Permission.DELETE_ISSUES), BulkOperationsController_1.default.bulkDelete);
router.post("/move-to-sprint", (0, rbac_1.hasProjectPermission)(enums_1.Permission.MANAGE_SPRINTS), BulkOperationsController_1.default.bulkMoveToSprint);
router.post("/priority", (0, rbac_1.hasProjectPermission)(enums_1.Permission.EDIT_ISSUES), BulkOperationsController_1.default.bulkUpdatePriority);
exports.default = router;
