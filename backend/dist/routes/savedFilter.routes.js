"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SavedFilterController_1 = __importDefault(require("../controllers/SavedFilterController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/", SavedFilterController_1.default.createFilter);
router.get("/", SavedFilterController_1.default.getUserFilters);
router.get("/:id", SavedFilterController_1.default.getFilterById);
router.put("/:id", SavedFilterController_1.default.updateFilter);
router.delete("/:id", SavedFilterController_1.default.deleteFilter);
router.post("/:id/share", SavedFilterController_1.default.shareFilter);
router.post("/:id/clone", SavedFilterController_1.default.cloneFilter);
exports.default = router;
