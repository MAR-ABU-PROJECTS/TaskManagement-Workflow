"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const data_1 = require("../data");
const router = express_1.default.Router();
router.get("/", auth_1.authenticate, (_req, res) => {
    res.json(data_1.teams);
});
router.post("/", auth_1.authenticate, (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    const newTeam = {
        id: (0, data_1.generateId)(),
        name,
        description,
        members: [{ userId: req.user.id, role: "OWNER" }],
        createdAt: new Date(),
    };
    data_1.teams.push(newTeam);
    return res.status(201).json(newTeam);
});
router.get("/:id", auth_1.authenticate, (req, res) => {
    const team = data_1.teams.find((t) => t.id === req.params.id);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    return res.json(team);
});
router.put("/:id", auth_1.authenticate, (req, res) => {
    const team = data_1.teams.find((t) => t.id === req.params.id);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    const membership = team.members.find((m) => m.userId === req.user.id);
    if (!membership ||
        (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const { name, description } = req.body;
    if (name)
        team.name = name;
    if (description !== undefined)
        team.description = description;
    return res.json(team);
});
router.delete("/:id", auth_1.authenticate, (req, res) => {
    const teamIndex = data_1.teams.findIndex((t) => t.id === req.params.id);
    if (teamIndex === -1) {
        return res.status(404).json({ message: "Team not found" });
    }
    const team = data_1.teams[teamIndex];
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    const membership = team.members.find((m) => m.userId === req.user.id);
    if (!membership || membership.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can delete teams" });
    }
    data_1.teams.splice(teamIndex, 1);
    return res.status(204).send();
});
router.post("/:id/members", auth_1.authenticate, (req, res) => {
    const team = data_1.teams.find((t) => t.id === req.params.id);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    const membership = team.members.find((m) => m.userId === req.user.id);
    if (!membership ||
        (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const { userId, role } = req.body;
    const user = data_1.users.find((u) => u.id === userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    if (team.members.some((m) => m.userId === userId)) {
        return res.status(409).json({ message: "User already in team" });
    }
    const newMember = {
        userId,
        role: role || "MEMBER",
    };
    team.members.push(newMember);
    return res.status(201).json(team);
});
router.delete("/:id/members/:userId", auth_1.authenticate, (req, res) => {
    const team = data_1.teams.find((t) => t.id === req.params.id);
    if (!team) {
        return res.status(404).json({ message: "Team not found" });
    }
    const membership = team.members.find((m) => m.userId === req.user.id);
    if (!membership ||
        (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const memberIndex = team.members.findIndex((m) => m.userId === req.params.userId);
    if (memberIndex === -1) {
        return res.status(404).json({ message: "Member not found" });
    }
    team.members.splice(memberIndex, 1);
    return res.status(204).send();
});
exports.default = router;
//# sourceMappingURL=teams.js.map