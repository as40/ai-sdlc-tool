import type { Request, Response, NextFunction } from 'express';
import { MockLoginSchema } from './auth.schemas';
import { authService } from './auth.service';

export async function mockLoginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (process.env['NODE_ENV'] !== 'development') {
    res
      .status(404)
      .json({
        status: 404,
        title: 'Not Found',
        detail: 'Route not available in this environment.',
      });
    return;
  }

  const parsed = MockLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      status: 400,
      title: 'Validation Error',
      detail: parsed.error.errors[0]?.message ?? 'Invalid request body',
    });
    return;
  }

  try {
    const token = await authService.mockLogin(parsed.data);
    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
}
