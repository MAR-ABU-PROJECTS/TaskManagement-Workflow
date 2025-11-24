"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SearchController_1 = __importDefault(require("../controllers/SearchController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post("/search/advanced", SearchController_1.default.advancedSearch);
router.post("/search/jql", SearchController_1.default.jqlSearch);
exports.default = router;
