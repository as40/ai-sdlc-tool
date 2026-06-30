export type WsEvent =
  | { type: 'pong'; payload: Record<string, never>; timestamp: string }
  | { type: 'error'; payload: { message: string }; timestamp: string }
  | {
      type: 'workflow:update';
      payload: { workflowId: string; status: string; detail?: string };
      timestamp: string;
    }
  | {
      type: 'vectorization:progress';
      payload: { progress: number; repositoryId: string };
      timestamp: string;
    }
  | {
      type: 'container:log';
      payload: { line: string; stream: 'stdout' | 'stderr' };
      timestamp: string;
    };

export function makeEvent<T extends WsEvent['type']>(
  type: T,
  payload: Extract<WsEvent, { type: T }>['payload'],
): Extract<WsEvent, { type: T }> {
  return { type, payload, timestamp: new Date().toISOString() } as unknown as Extract<
    WsEvent,
    { type: T }
  >;
}
