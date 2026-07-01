import type { Request, Response, NextFunction } from 'express';
import { workspaceRepository } from '../modules/workspaces/workspace.repository';

export async function workspaceGuard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = req.params['id'] as string;
  const user = req.user;

  if (!workspaceId || !user) {
    res.status(400).json({ status: 400, title: 'Bad Request', detail: 'Missing workspace id.' });
    return;
  }

  // SUPER_ADMIN bypasses membership check — verify workspace exists only
  if (user.role === 'SUPER_ADMIN') {
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      res.status(404).json({ status: 404, title: 'Not Found', detail: 'Workspace not found.' });
      return;
    }
    req.workspaceId = workspaceId as string;
    next();
    return;
  }

  const member = await workspaceRepository.findMember(workspaceId as string, user.sub);
  if (!member) {
    res
      .status(403)
      .json({ status: 403, title: 'Forbidden', detail: 'Not a member of this workspace.' });
    return;
  }

  req.workspaceId = workspaceId as string;
  req.workspaceMember = member;
  next();
}
