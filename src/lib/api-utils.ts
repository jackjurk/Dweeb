import { NextApiResponse } from 'next';
import { z } from 'zod';
import { handleDecimalJSON } from './prisma';

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      details: this.details,
    };
  }
}

export const apiHandler = (handler: Function) => {
  return async (req: any, res: NextApiResponse) => {
    try {
      // Set default headers
      res.setHeader('Content-Type', 'application/json');
      
      // Handle CORS in development
      if (process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
          return res.status(200).end();
        }
      }

      // Handle the request
      const result = await handler(req, res);
      
      // If headers were already sent in the handler, don't send another response
      if (res.headersSent) {
        return;
      }
      
      // Send success response
      res.status(200).json({
        success: true,
        data: handleDecimalJSON(result),
      });
      
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          details: error.details,
        });
      }
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors,
        });
      }
      
      // Default error response
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };
};

// Role-based access control
export const withRole = (roles: string[]) => {
  return (handler: Function) => {
    return async (req: any, res: NextApiResponse) => {
      const { user } = req.session || {};
      
      if (!user) {
        throw new ApiError('Unauthorized', 401);
      }
      
      if (!roles.includes(user.role)) {
        throw new ApiError('Forbidden', 403);
      }
      
      return handler(req, res);
    };
  };
};

// Validation helper
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.data;
};
