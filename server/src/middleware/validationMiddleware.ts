import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/AppError';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 400));
    }
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return next(new AppError(message, 400));
    }
    next();
  };
};