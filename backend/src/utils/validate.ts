import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema<any>, where: 'body'|'query'|'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const src =
      where === 'body'  ? req.body  :
      where === 'query' ? req.query :
                          req.params;

    const parsed = schema.safeParse(src);
    if (!parsed.success) {
      return res.status(400).json({ error: 'ValidationError', details: parsed.error.flatten() });
    }

    // Put validated payload into res.locals, don't assign to req.query/params
    (res.locals as any).__validated ??= {};
    (res.locals as any).__validated[where] = parsed.data;

    // It's still safe to assign body (but we'll keep it consistent)
    if (where === 'body') req.body = parsed.data as any;

    next();
  };
}
