import type { JwtPayload } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends JwtPayload {}
    interface Request {
      user?: JwtPayload;
    }
  }
}
