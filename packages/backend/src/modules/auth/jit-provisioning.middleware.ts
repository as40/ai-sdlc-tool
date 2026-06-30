import { userRepository } from '../users/user.repository';
import type { SsoProfile, UserRecord } from '../users/user.types';
import { logger } from '../../utils/logger';

export class JitProvisioningError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'JitProvisioningError';
  }
}

export async function jitProvisioningMiddleware(
  profile: SsoProfile,
  done: (err: Error | null, user?: UserRecord) => void,
): Promise<void> {
  try {
    const { user, isNew } = await userRepository.upsert(profile);

    if (user.deletedAt !== null) {
      logger.warn({ event: 'jit_login_rejected', email: profile.email, reason: 'account_deleted' });
      done(new JitProvisioningError('Account has been deactivated.', 403));
      return;
    }

    logger.info({
      event: isNew ? 'jit_user_provisioned' : 'jit_user_login',
      userId: user.id,
      email: user.email,
    });

    done(null, user);
  } catch (err) {
    done(err instanceof Error ? err : new Error(String(err)));
  }
}
