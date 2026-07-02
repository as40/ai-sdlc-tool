export class ServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly title: string,
    message: string,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
