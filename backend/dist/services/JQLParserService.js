"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JQLParserService = void 0;
class JQLParserService {
    static parseJQL(jql, userId) {
        if (!jql || jql.trim() === "") {
            return {};
        }
        try {
            const tokens = this.tokenize(jql);
            const whereClause = this.tokensToWhereClause(tokens, userId);
            return whereClause;
        }
        catch (error) {
            throw new Error(`JQL Parse Error: ${error instanceof Error ? error.message : "Invalid syntax"}`);
        }
    }
    static tokenize(jql) {
        const tokens = [];
        let current = 0;
        const input = jql.trim();
        while (current < input.length) {
            const currentChar = input[current];
            if (!currentChar)
                break;
            if (/\s/.test(currentChar)) {
                current++;
                continue;
            }
            if (currentChar === "(") {
                const prevTokens = tokens.slice(-1);
                if (prevTokens.length > 0 &&
                    prevTokens[0] &&
                    prevTokens[0].type === "FIELD" &&
                    input
                        .slice(current - prevTokens[0].value.length, current + 1)
                        .match(/\w+\(/)) {
                    const functionName = prevTokens[0].value;
                    tokens.pop();
                    current++;
                    if (input[current] === ")") {
                        tokens.push({ type: "FUNCTION", value: `${functionName}()` });
                        current++;
                    }
                }
                else {
                    tokens.push({ type: "LPAREN", value: "(" });
                    current++;
                }
                continue;
            }
            if (currentChar === ")") {
                tokens.push({ type: "RPAREN", value: ")" });
                current++;
                continue;
            }
            if (currentChar === '"' || currentChar === "'") {
                const quote = currentChar;
                let value = "";
                current++;
                while (current < input.length && input[current] !== quote) {
                    value += input[current];
                    current++;
                }
                if (current >= input.length) {
                    throw new Error("Unterminated string");
                }
                current++;
                tokens.push({ type: "VALUE", value, raw: `${quote}${value}${quote}` });
                continue;
            }
            const remaining = input.slice(current).toUpperCase();
            let operatorFound = false;
            for (const op of this.OPERATORS) {
                if (remaining.startsWith(op + " ") || remaining.startsWith(op + ")")) {
                    tokens.push({ type: "OPERATOR", value: op });
                    current += op.length;
                    operatorFound = true;
                    break;
                }
            }
            if (operatorFound)
                continue;
            for (const logOp of this.LOGICAL_OPERATORS) {
                if (remaining.startsWith(logOp + " ") || remaining === logOp) {
                    tokens.push({ type: "LOGICAL", value: logOp });
                    current += logOp.length;
                    operatorFound = true;
                    break;
                }
            }
            if (operatorFound)
                continue;
            if (["=", "!", "<", ">", "~"].includes(currentChar)) {
                let op = currentChar;
                current++;
                const nextChar = input[current];
                if (nextChar && ["=", "~"].includes(nextChar)) {
                    op += nextChar;
                    current++;
                }
                tokens.push({ type: "OPERATOR", value: op });
                continue;
            }
            if (currentChar === ",") {
                current++;
                continue;
            }
            let word = "";
            while (current < input.length) {
                const char = input[current];
                if (char && /[a-zA-Z0-9_.]/.test(char)) {
                    word += char;
                    current++;
                }
                else {
                    break;
                }
            }
            if (word) {
                if (this.LOGICAL_OPERATORS.includes(word.toUpperCase())) {
                    tokens.push({ type: "LOGICAL", value: word.toUpperCase() });
                }
                else {
                    const lastToken = tokens[tokens.length - 1];
                    if (!lastToken ||
                        lastToken.type === "LOGICAL" ||
                        lastToken.type === "LPAREN") {
                        tokens.push({ type: "FIELD", value: word });
                    }
                    else if (lastToken.type === "OPERATOR") {
                        tokens.push({ type: "VALUE", value: word });
                    }
                    else {
                        tokens.push({ type: "FIELD", value: word });
                    }
                }
            }
        }
        return tokens;
    }
    static tokensToWhereClause(tokens, userId) {
        if (tokens.length === 0)
            return {};
        const conditions = [];
        let currentLogical = "AND";
        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];
            if (!token)
                break;
            if (token.type === "LOGICAL") {
                currentLogical = token.value;
                i++;
                continue;
            }
            if (token.type === "FIELD") {
                const field = token.value;
                const operator = tokens[i + 1];
                if (!operator || operator.type !== "OPERATOR") {
                    throw new Error(`Expected operator after field "${field}"`);
                }
                let value = tokens[i + 2];
                if (!value) {
                    throw new Error(`Expected value after operator "${operator.value}"`);
                }
                if (operator.value.toUpperCase() === "IN" ||
                    operator.value.toUpperCase() === "NOT IN") {
                    const values = [];
                    let j = i + 2;
                    const parenToken = tokens[j];
                    if (parenToken && parenToken.type === "LPAREN") {
                        j++;
                    }
                    while (j < tokens.length) {
                        const currentToken = tokens[j];
                        if (!currentToken)
                            break;
                        if (currentToken.type === "RPAREN")
                            break;
                        if (currentToken.type === "VALUE") {
                            values.push(currentToken.value);
                        }
                        j++;
                    }
                    const condition = this.buildCondition(field, operator.value, values);
                    conditions.push(condition);
                    i = j + 1;
                    continue;
                }
                if (value.type === "FUNCTION") {
                    value = {
                        ...value,
                        value: this.evaluateFunction(value.value, userId),
                    };
                }
                const condition = this.buildCondition(field, operator.value, value.value);
                conditions.push(condition);
                i += 3;
                continue;
            }
            i++;
        }
        if (conditions.length === 0)
            return {};
        if (conditions.length === 1)
            return conditions[0];
        return currentLogical === "OR" ? { OR: conditions } : { AND: conditions };
    }
    static buildCondition(field, operator, value) {
        const condition = {};
        const fieldMap = {
            project: "projectId",
            assignee: "assigneeId",
            reporter: "createdBy",
            sprint: "sprintId",
            epic: "epicId",
            type: "type",
            status: "status",
            priority: "priority",
            labels: "labels",
            created: "createdAt",
            updated: "updatedAt",
        };
        const prismaField = fieldMap[field.toLowerCase()] || field;
        switch (operator.toUpperCase()) {
            case "=":
                condition[prismaField] = this.convertValue(prismaField, Array.isArray(value) ? value[0] ?? "" : value);
                break;
            case "!=":
                condition[prismaField] = {
                    not: this.convertValue(prismaField, Array.isArray(value) ? value[0] ?? "" : value),
                };
                break;
            case ">":
                condition[prismaField] = {
                    gt: this.convertValue(prismaField, Array.isArray(value) ? value[0] ?? "" : value),
                };
                break;
            case ">=":
                condition[prismaField] = {
                    gte: this.convertValue(prismaField, Array.isArray(value) ? value[0] ?? "" : value),
                };
                break;
            case "<":
                condition[prismaField] = {
                    lt: this.convertValue(prismaField, Array.isArray(value) ? value[0] ?? "" : value),
                };
                break;
            case "<=":
                condition[prismaField] = {
                    lte: this.convertValue(prismaField, Array.isArray(value) ? value[0] ?? "" : value),
                };
                break;
            case "~":
                if (prismaField === "title" || prismaField === "description") {
                    condition[prismaField] = {
                        contains: value,
                        mode: "insensitive",
                    };
                }
                else {
                    condition[prismaField] = { contains: value };
                }
                break;
            case "!~":
                if (prismaField === "title" || prismaField === "description") {
                    condition[prismaField] = {
                        not: { contains: value, mode: "insensitive" },
                    };
                }
                else {
                    condition[prismaField] = { not: { contains: value } };
                }
                break;
            case "IN":
                condition[prismaField] = {
                    in: value.map((v) => this.convertValue(prismaField, v)),
                };
                break;
            case "NOT IN":
                condition[prismaField] = {
                    notIn: value.map((v) => this.convertValue(prismaField, v)),
                };
                break;
            case "IS":
                if (value.toUpperCase() === "NULL" ||
                    value.toUpperCase() === "EMPTY") {
                    condition[prismaField] = null;
                }
                break;
            case "IS NOT":
                if (value.toUpperCase() === "NULL" ||
                    value.toUpperCase() === "EMPTY") {
                    condition[prismaField] = { not: null };
                }
                break;
        }
        return condition;
    }
    static convertValue(field, value) {
        if (field === "createdAt" || field === "updatedAt" || field === "dueDate") {
            return new Date(value);
        }
        if (field === "status") {
            return value.toUpperCase();
        }
        if (field === "priority") {
            return value.toUpperCase();
        }
        if (field === "storyPoints") {
            return parseInt(value, 10);
        }
        return value;
    }
    static evaluateFunction(functionCall, userId) {
        if (functionCall === "currentUser()") {
            if (!userId) {
                throw new Error("currentUser() function requires userId parameter");
            }
            return userId;
        }
        throw new Error(`Unknown function: ${functionCall}`);
    }
    static validateJQL(jql) {
        try {
            this.parseJQL(jql);
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : "Invalid JQL syntax",
            };
        }
    }
    static getSuggestions(partialJQL) {
        const suggestions = [];
        const lastWord = partialJQL.trim().split(/\s+/).pop() || "";
        const fields = [
            "project",
            "status",
            "priority",
            "assignee",
            "reporter",
            "sprint",
            "epic",
            "type",
            "labels",
            "created",
            "updated",
        ];
        if (!partialJQL.includes("=") && !partialJQL.includes("IN")) {
            fields.forEach((field) => {
                if (field.startsWith(lastWord.toLowerCase())) {
                    suggestions.push(field);
                }
            });
        }
        if (partialJQL.match(/\w+\s*$/)) {
            this.OPERATORS.forEach((op) => {
                suggestions.push(op);
            });
        }
        if (partialJQL.match(/".+"\s*$/)) {
            this.LOGICAL_OPERATORS.forEach((op) => {
                suggestions.push(op);
            });
        }
        return suggestions;
    }
}
exports.JQLParserService = JQLParserService;
JQLParserService.OPERATORS = [
    "=",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "~",
    "!~",
    "IN",
    "NOT IN",
    "IS",
    "IS NOT",
];
JQLParserService.LOGICAL_OPERATORS = ["AND", "OR"];
exports.default = JQLParserService;
