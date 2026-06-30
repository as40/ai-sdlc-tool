import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import type { MockLoginInput } from './auth.schemas';

export class AuthService {
  async mockLogin(input: MockLoginInput): Promise<string> {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) throw new Error('JWT_SECRET is not configured');

    const email = input.email ?? `dev-${input.role.toLowerCase()}@localhost`;

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    let userId: string;
    let userEmail: string;

    if (existing) {
      userId = existing.id;
      userEmail = existing.email;
    } else {
      const [created] = await db
        .insert(users)
        .values({ email, displayName: `Dev ${input.role}`, accessLevel: input.role })
        .returning();
      userId = created.id;
      userEmail = created.email;
    }

    return jwt.sign({ sub: userId, email: userEmail, role: input.role }, jwtSecret, {
      expiresIn: '8h',
    });
  }
}

export const authService = new AuthService();
