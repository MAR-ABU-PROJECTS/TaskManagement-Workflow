"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_ROLE_HIERARCHY = exports.ROLE_HIERARCHY = exports.ALLOWED_STATUS_TRANSITIONS = exports.DependencyType = exports.SprintStatus = exports.WorkflowStatus = exports.BoardType = exports.Permission = exports.ProjectRole = exports.NotificationType = exports.ActivityAction = exports.IssueType = exports.TaskPriority = exports.TaskStatus = exports.Department = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["CEO"] = "CEO";
    UserRole["HOO"] = "HOO";
    UserRole["HR"] = "HR";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["STAFF"] = "STAFF";
})(UserRole || (exports.UserRole = UserRole = {}));
var Department;
(function (Department) {
    Department["OPS"] = "OPS";
    Department["HR"] = "HR";
})(Department || (exports.Department = Department = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["DRAFT"] = "DRAFT";
    TaskStatus["ASSIGNED"] = "ASSIGNED";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["PAUSED"] = "PAUSED";
    TaskStatus["REVIEW"] = "REVIEW";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["REJECTED"] = "REJECTED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["MEDIUM"] = "MEDIUM";
    TaskPriority["HIGH"] = "HIGH";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var IssueType;
(function (IssueType) {
    IssueType["TASK"] = "TASK";
    IssueType["BUG"] = "BUG";
    IssueType["STORY"] = "STORY";
})(IssueType || (exports.IssueType = IssueType = {}));
var ActivityAction;
(function (ActivityAction) {
    ActivityAction["CREATE"] = "CREATE";
    ActivityAction["ASSIGN"] = "ASSIGN";
    ActivityAction["APPROVE"] = "APPROVE";
    ActivityAction["REJECT"] = "REJECT";
    ActivityAction["STATUS_UPDATE"] = "STATUS_UPDATE";
    ActivityAction["COMMENT"] = "COMMENT";
})(ActivityAction || (exports.ActivityAction = ActivityAction = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["TASK_ASSIGNED"] = "TASK_ASSIGNED";
    NotificationType["STATUS_CHANGED"] = "STATUS_CHANGED";
    NotificationType["COMMENT"] = "COMMENT";
    NotificationType["MENTION"] = "MENTION";
    NotificationType["APPROVAL_REQUIRED"] = "APPROVAL_REQUIRED";
    NotificationType["APPROVED"] = "APPROVED";
    NotificationType["REJECTED"] = "REJECTED";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var ProjectRole;
(function (ProjectRole) {
    ProjectRole["PROJECT_ADMIN"] = "PROJECT_ADMIN";
    ProjectRole["PROJECT_LEAD"] = "PROJECT_LEAD";
    ProjectRole["DEVELOPER"] = "DEVELOPER";
    ProjectRole["REPORTER"] = "REPORTER";
    ProjectRole["VIEWER"] = "VIEWER";
})(ProjectRole || (exports.ProjectRole = ProjectRole = {}));
var Permission;
(function (Permission) {
    Permission["ADMINISTER_PROJECT"] = "ADMINISTER_PROJECT";
    Permission["BROWSE_PROJECT"] = "BROWSE_PROJECT";
    Permission["EDIT_PROJECT"] = "EDIT_PROJECT";
    Permission["CREATE_ISSUES"] = "CREATE_ISSUES";
    Permission["EDIT_ISSUES"] = "EDIT_ISSUES";
    Permission["EDIT_OWN_ISSUES"] = "EDIT_OWN_ISSUES";
    Permission["DELETE_ISSUES"] = "DELETE_ISSUES";
    Permission["DELETE_OWN_ISSUES"] = "DELETE_OWN_ISSUES";
    Permission["ASSIGN_ISSUES"] = "ASSIGN_ISSUES";
    Permission["ASSIGNABLE_USER"] = "ASSIGNABLE_USER";
    Permission["CLOSE_ISSUES"] = "CLOSE_ISSUES";
    Permission["TRANSITION_ISSUES"] = "TRANSITION_ISSUES";
    Permission["MOVE_ISSUES"] = "MOVE_ISSUES";
    Permission["ADD_COMMENTS"] = "ADD_COMMENTS";
    Permission["EDIT_ALL_COMMENTS"] = "EDIT_ALL_COMMENTS";
    Permission["EDIT_OWN_COMMENTS"] = "EDIT_OWN_COMMENTS";
    Permission["DELETE_ALL_COMMENTS"] = "DELETE_ALL_COMMENTS";
    Permission["DELETE_OWN_COMMENTS"] = "DELETE_OWN_COMMENTS";
    Permission["CREATE_ATTACHMENTS"] = "CREATE_ATTACHMENTS";
    Permission["DELETE_ALL_ATTACHMENTS"] = "DELETE_ALL_ATTACHMENTS";
    Permission["DELETE_OWN_ATTACHMENTS"] = "DELETE_OWN_ATTACHMENTS";
    Permission["WORK_ON_ISSUES"] = "WORK_ON_ISSUES";
    Permission["EDIT_OWN_WORKLOGS"] = "EDIT_OWN_WORKLOGS";
    Permission["EDIT_ALL_WORKLOGS"] = "EDIT_ALL_WORKLOGS";
    Permission["DELETE_OWN_WORKLOGS"] = "DELETE_OWN_WORKLOGS";
    Permission["DELETE_ALL_WORKLOGS"] = "DELETE_ALL_WORKLOGS";
    Permission["MANAGE_SPRINTS"] = "MANAGE_SPRINTS";
    Permission["VIEW_SPRINTS"] = "VIEW_SPRINTS";
    Permission["MANAGE_EPICS"] = "MANAGE_EPICS";
    Permission["VIEW_EPICS"] = "VIEW_EPICS";
})(Permission || (exports.Permission = Permission = {}));
var BoardType;
(function (BoardType) {
    BoardType["SCRUM"] = "SCRUM";
    BoardType["KANBAN"] = "KANBAN";
})(BoardType || (exports.BoardType = BoardType = {}));
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["TODO"] = "TODO";
    WorkflowStatus["IN_PROGRESS"] = "IN_PROGRESS";
    WorkflowStatus["DONE"] = "DONE";
    WorkflowStatus["CUSTOM"] = "CUSTOM";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var SprintStatus;
(function (SprintStatus) {
    SprintStatus["PLANNING"] = "PLANNING";
    SprintStatus["ACTIVE"] = "ACTIVE";
    SprintStatus["COMPLETED"] = "COMPLETED";
    SprintStatus["CANCELLED"] = "CANCELLED";
})(SprintStatus || (exports.SprintStatus = SprintStatus = {}));
var DependencyType;
(function (DependencyType) {
    DependencyType["BLOCKS"] = "BLOCKS";
    DependencyType["IS_BLOCKED_BY"] = "IS_BLOCKED_BY";
    DependencyType["RELATES_TO"] = "RELATES_TO";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
exports.ALLOWED_STATUS_TRANSITIONS = {
    [TaskStatus.DRAFT]: [TaskStatus.ASSIGNED],
    [TaskStatus.ASSIGNED]: [TaskStatus.IN_PROGRESS, TaskStatus.REJECTED],
    [TaskStatus.IN_PROGRESS]: [
        TaskStatus.PAUSED,
        TaskStatus.REVIEW,
        TaskStatus.COMPLETED,
    ],
    [TaskStatus.PAUSED]: [TaskStatus.IN_PROGRESS, TaskStatus.REJECTED],
    [TaskStatus.REVIEW]: [
        TaskStatus.IN_PROGRESS,
        TaskStatus.COMPLETED,
        TaskStatus.REJECTED,
    ],
    [TaskStatus.COMPLETED]: [],
    [TaskStatus.REJECTED]: [TaskStatus.DRAFT],
};
exports.ROLE_HIERARCHY = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.CEO]: 80,
    [UserRole.HOO]: 60,
    [UserRole.HR]: 60,
    [UserRole.ADMIN]: 40,
    [UserRole.STAFF]: 20,
};
exports.PROJECT_ROLE_HIERARCHY = {
    [ProjectRole.PROJECT_ADMIN]: 4,
    [ProjectRole.PROJECT_LEAD]: 3,
    [ProjectRole.DEVELOPER]: 2,
    [ProjectRole.REPORTER]: 1,
    [ProjectRole.VIEWER]: 0,
};
