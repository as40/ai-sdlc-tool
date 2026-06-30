export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CryptoError extends AppError {
  constructor(message: string) {
    super(message, 500, 'CRYPTO_ERROR');
  }
}
