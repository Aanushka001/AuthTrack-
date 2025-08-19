
// ### server/src/utils/response.ts
import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode: number = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: string, statusCode: number = 400) => {
  const response: ApiResponse = {
    success: false,
    error
  };
  res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response, 
  data: T[], 
  page: number, 
  limit: number, 
  total: number, 
  message?: string
) => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
  res.json(response);
};
