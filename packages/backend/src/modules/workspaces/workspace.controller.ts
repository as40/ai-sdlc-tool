import type { Request, Response } from 'express';
import { createWorkspaceSchema, inviteMemberSchema } from './workspace.schemas';
import { workspaceService } from './workspace.service';
import { ServiceError } from './workspace.errors';

function handleError(res: Response, err: unknown): void {
  if (err instanceof ServiceError) {
    res
      .status(err.statusCode)
      .json({ status: err.statusCode, title: err.title, detail: err.message });
    return;
  }
  res
    .status(500)
    .json({ status: 500, title: 'Internal Server Error', detail: 'An unexpected error occurred.' });
}

export async function createWorkspaceController(req: Request, res: Response): Promise<void> {
  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: 400, title: 'Bad Request', detail: parsed.error.message });
    return;
  }
  try {
    const result = await workspaceService.createWorkspace(parsed.data.name, req.user!.sub);
    res.status(201).json(result.workspace);
  } catch (err) {
    handleError(res, err);
  }
}

export async function listWorkspacesController(req: Request, res: Response): Promise<void> {
  try {
    const workspaces = await workspaceService.listWorkspaces(req.user!.sub);
    res.status(200).json(workspaces);
  } catch (err) {
    handleError(res, err);
  }
}

export async function getWorkspaceController(req: Request, res: Response): Promise<void> {
  try {
    const workspace = await workspaceService.getWorkspace(req.params['id'] as string);
    res.status(200).json(workspace);
  } catch (err) {
    handleError(res, err);
  }
}

export async function inviteUserController(req: Request, res: Response): Promise<void> {
  const parsed = inviteMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ status: 400, title: 'Bad Request', detail: parsed.error.message });
    return;
  }
  try {
    const member = await workspaceService.inviteUser(
      req.workspaceId!,
      parsed.data.email,
      parsed.data.role,
    );
    res.status(201).json(member);
  } catch (err) {
    handleError(res, err);
  }
}

export async function removeMemberController(req: Request, res: Response): Promise<void> {
  const targetUserId = req.params['userId'] as string;
  try {
    await workspaceService.removeMember(req.workspaceId!, targetUserId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
}
