import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: any[] | undefined;

  // Handle operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Prisma errors
  else if ("code" in err && "meta" in err) {
    statusCode = 400;
    const prismaErr = err as { code: string; meta?: { target?: string[] } };

    // Unique constraint violation
    if (prismaErr.code === "P2002") {
      const target = (prismaErr.meta?.target as string[]) || [];
      message = `${target.join(", ")} already exists`;
    }

    // Foreign key constraint violation
    else if (prismaErr.code === "P2003") {
      message = "Related record not found";
    }

    // Record not found
    else if (prismaErr.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else {
      message = "Database operation failed";
    }
  }

  // Handle Prisma validation errors
  else if (err.constructor.name === "PrismaClientValidationError") {
    statusCode = 400;
    message = "Invalid data provided";
  }

  // Log error
  logger.error(
    `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  );

  if (err.stack) {
    logger.error(err.stack);
  }

  // Send response
  res.status(statusCode).json({
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
}
