import { Prisma } from "@prisma/client";
import { TaskStatus, TaskPriority } from "../types/enums";

/**
 * JQL (Jira Query Language) Parser Service
 * Converts JQL-like query strings into Prisma where clauses
 *
 * Supported syntax:
 * - Field operators: =, !=, <, >, <=, >=, ~, !~, IN, NOT IN
 * - Logical operators: AND, OR
 * - Functions: currentUser()
 * - Fields: project, status, priority, assignee, reporter, sprint, epic, type, labels, created, updated
 *
 * Examples:
 * - project = "PROJ-1" AND status IN ("TODO", "IN_PROGRESS")
 * - assignee = currentUser() AND priority = "HIGH"
 * - status != "COMPLETED" OR reporter = currentUser()
 */

interface JQLToken {
  type:
    | "FIELD"
    | "OPERATOR"
    | "VALUE"
    | "LOGICAL"
    | "LPAREN"
    | "RPAREN"
    | "FUNCTION";
  value: string;
  raw?: string;
}

export class JQLParserService {
  private static readonly OPERATORS = [
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
  private static readonly LOGICAL_OPERATORS = ["AND", "OR"];

  /**
   * Parse JQL query string and return Prisma where clause
   */
  static parseJQL(jql: string, userId?: string): Prisma.TaskWhereInput {
    if (!jql || jql.trim() === "") {
      return {};
    }

    try {
      const tokens = this.tokenize(jql);
      const whereClause = this.tokensToWhereClause(tokens, userId);
      return whereClause;
    } catch (error) {
      throw new Error(
        `JQL Parse Error: ${
          error instanceof Error ? error.message : "Invalid syntax"
        }`
      );
    }
  }

  /**
   * Tokenize JQL string into tokens
   */
  private static tokenize(jql: string): JQLToken[] {
    const tokens: JQLToken[] = [];
    let current = 0;
    const input = jql.trim();

    while (current < input.length) {
      // Skip whitespace
      const currentChar = input[current];
      if (!currentChar) break;

      if (/\s/.test(currentChar)) {
        current++;
        continue;
      }

      // Parentheses
      if (currentChar === "(") {
        // Check if it's a function like currentUser()
        const prevTokens = tokens.slice(-1);
        if (
          prevTokens.length > 0 &&
          prevTokens[0] &&
          prevTokens[0].type === "FIELD" &&
          input
            .slice(current - prevTokens[0].value.length, current + 1)
            .match(/\w+\(/)
        ) {
          // It's a function
          const functionName = prevTokens[0].value;
          tokens.pop(); // Remove the field token
          current++; // Skip (
          if (input[current] === ")") {
            tokens.push({ type: "FUNCTION", value: `${functionName}()` });
            current++;
          }
        } else {
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

      // String values (quoted)
      if (currentChar === '"' || currentChar === "'") {
        const quote = currentChar;
        let value = "";
        current++; // Skip opening quote

        while (current < input.length && input[current] !== quote) {
          value += input[current];
          current++;
        }

        if (current >= input.length) {
          throw new Error("Unterminated string");
        }

        current++; // Skip closing quote
        tokens.push({ type: "VALUE", value, raw: `${quote}${value}${quote}` });
        continue;
      }

      // Multi-character operators (NOT IN, IS NOT, etc.)
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

      if (operatorFound) continue;

      // Logical operators
      for (const logOp of this.LOGICAL_OPERATORS) {
        if (remaining.startsWith(logOp + " ") || remaining === logOp) {
          tokens.push({ type: "LOGICAL", value: logOp });
          current += logOp.length;
          operatorFound = true;
          break;
        }
      }

      if (operatorFound) continue;

      // Single character operators
      if (["=", "!", "<", ">", "~"].includes(currentChar)) {
        let op = currentChar;
        current++;

        // Check for two-character operators
        const nextChar = input[current];
        if (nextChar && ["=", "~"].includes(nextChar)) {
          op += nextChar;
          current++;
        }

        tokens.push({ type: "OPERATOR", value: op });
        continue;
      }

      // Comma (for IN operator values)
      if (currentChar === ",") {
        current++;
        continue;
      }

      // Field names or unquoted values
      let word = "";
      while (current < input.length) {
        const char = input[current];
        if (char && /[a-zA-Z0-9_.]/.test(char)) {
          word += char;
          current++;
        } else {
          break;
        }
      }

      if (word) {
        // Check if it's a logical operator
        if (this.LOGICAL_OPERATORS.includes(word.toUpperCase())) {
          tokens.push({ type: "LOGICAL", value: word.toUpperCase() });
        } else {
          // Determine if it's a field or value based on context
          const lastToken = tokens[tokens.length - 1];
          if (
            !lastToken ||
            lastToken.type === "LOGICAL" ||
            lastToken.type === "LPAREN"
          ) {
            tokens.push({ type: "FIELD", value: word });
          } else if (lastToken.type === "OPERATOR") {
            tokens.push({ type: "VALUE", value: word });
          } else {
            tokens.push({ type: "FIELD", value: word });
          }
        }
      }
    }

    return tokens;
  }

  /**
   * Convert tokens to Prisma where clause
   */
  private static tokensToWhereClause(
    tokens: JQLToken[],
    userId?: string
  ): Prisma.TaskWhereInput {
    if (tokens.length === 0) return {};

    const conditions: Prisma.TaskWhereInput[] = [];
    let currentLogical: "AND" | "OR" = "AND";
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      if (!token) break;

      // Handle logical operators
      if (token.type === "LOGICAL") {
        currentLogical = token.value as "AND" | "OR";
        i++;
        continue;
      }

      // Handle field conditions
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

        // Handle IN operator with multiple values
        if (
          operator.value.toUpperCase() === "IN" ||
          operator.value.toUpperCase() === "NOT IN"
        ) {
          const values: string[] = [];
          let j = i + 2;

          // Expect opening parenthesis
          const parenToken = tokens[j];
          if (parenToken && parenToken.type === "LPAREN") {
            j++;
          }

          // Collect all values until closing parenthesis
          while (j < tokens.length) {
            const currentToken = tokens[j];
            if (!currentToken) break;
            if (currentToken.type === "RPAREN") break;
            if (currentToken.type === "VALUE") {
              values.push(currentToken.value);
            }
            j++;
          }

          const condition = this.buildCondition(field, operator.value, values);
          conditions.push(condition);

          i = j + 1; // Move past the closing parenthesis
          continue;
        }

        // Handle function values
        if (value.type === "FUNCTION") {
          value = {
            ...value,
            value: this.evaluateFunction(value.value, userId),
          };
        }

        const condition = this.buildCondition(
          field,
          operator.value,
          value.value
        );
        conditions.push(condition);

        i += 3; // Skip field, operator, value
        continue;
      }

      i++;
    }

    // Combine conditions with logical operators
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0]!;

    // For simplicity, we'll use AND as default
    // In a full implementation, we'd need to properly handle mixed AND/OR
    return currentLogical === "OR" ? { OR: conditions } : { AND: conditions };
  }

  /**
   * Build a single condition for a field
   */
  private static buildCondition(
    field: string,
    operator: string,
    value: string | string[]
  ): Prisma.TaskWhereInput {
    const condition: any = {};

    // Map JQL field names to Prisma field names
    const fieldMap: Record<string, string> = {
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

    // Handle different operators
    switch (operator.toUpperCase()) {
      case "=":
        condition[prismaField] = this.convertValue(
          prismaField,
          Array.isArray(value) ? value[0] ?? "" : value
        );
        break;

      case "!=":
        condition[prismaField] = {
          not: this.convertValue(
            prismaField,
            Array.isArray(value) ? value[0] ?? "" : value
          ),
        };
        break;

      case ">":
        condition[prismaField] = {
          gt: this.convertValue(
            prismaField,
            Array.isArray(value) ? value[0] ?? "" : value
          ),
        };
        break;

      case ">=":
        condition[prismaField] = {
          gte: this.convertValue(
            prismaField,
            Array.isArray(value) ? value[0] ?? "" : value
          ),
        };
        break;

      case "<":
        condition[prismaField] = {
          lt: this.convertValue(
            prismaField,
            Array.isArray(value) ? value[0] ?? "" : value
          ),
        };
        break;

      case "<=":
        condition[prismaField] = {
          lte: this.convertValue(
            prismaField,
            Array.isArray(value) ? value[0] ?? "" : value
          ),
        };
        break;

      case "~":
        // Contains (case-insensitive)
        if (prismaField === "title" || prismaField === "description") {
          condition[prismaField] = {
            contains: value as string,
            mode: "insensitive",
          };
        } else {
          condition[prismaField] = { contains: value as string };
        }
        break;

      case "!~":
        // Not contains
        if (prismaField === "title" || prismaField === "description") {
          condition[prismaField] = {
            not: { contains: value as string, mode: "insensitive" },
          };
        } else {
          condition[prismaField] = { not: { contains: value as string } };
        }
        break;

      case "IN":
        condition[prismaField] = {
          in: (value as string[]).map((v) => this.convertValue(prismaField, v)),
        };
        break;

      case "NOT IN":
        condition[prismaField] = {
          notIn: (value as string[]).map((v) =>
            this.convertValue(prismaField, v)
          ),
        };
        break;

      case "IS":
        if (
          (value as string).toUpperCase() === "NULL" ||
          (value as string).toUpperCase() === "EMPTY"
        ) {
          condition[prismaField] = null;
        }
        break;

      case "IS NOT":
        if (
          (value as string).toUpperCase() === "NULL" ||
          (value as string).toUpperCase() === "EMPTY"
        ) {
          condition[prismaField] = { not: null };
        }
        break;
    }

    return condition;
  }

  /**
   * Convert value to appropriate type based on field
   */
  private static convertValue(field: string, value: string): any {
    // Date fields
    if (field === "createdAt" || field === "updatedAt" || field === "dueDate") {
      return new Date(value);
    }

    // Enum fields
    if (field === "status") {
      return value.toUpperCase() as TaskStatus;
    }

    if (field === "priority") {
      return value.toUpperCase() as TaskPriority;
    }

    // Numeric fields
    if (field === "storyPoints") {
      return parseInt(value, 10);
    }

    return value;
  }

  /**
   * Evaluate JQL functions
   */
  private static evaluateFunction(
    functionCall: string,
    userId?: string
  ): string {
    if (functionCall === "currentUser()") {
      if (!userId) {
        throw new Error("currentUser() function requires userId parameter");
      }
      return userId;
    }

    throw new Error(`Unknown function: ${functionCall}`);
  }

  /**
   * Validate JQL syntax without executing
   */
  static validateJQL(jql: string): { valid: boolean; error?: string } {
    try {
      this.parseJQL(jql);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid JQL syntax",
      };
    }
  }

  /**
   * Get suggestions for autocomplete based on partial JQL
   */
  static getSuggestions(partialJQL: string): string[] {
    const suggestions: string[] = [];
    const lastWord = partialJQL.trim().split(/\s+/).pop() || "";

    // Field suggestions
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

    // Operator suggestions
    if (partialJQL.match(/\w+\s*$/)) {
      this.OPERATORS.forEach((op) => {
        suggestions.push(op);
      });
    }

    // Logical operator suggestions
    if (partialJQL.match(/".+"\s*$/)) {
      this.LOGICAL_OPERATORS.forEach((op) => {
        suggestions.push(op);
      });
    }

    return suggestions;
  }
}

export default JQLParserService;
