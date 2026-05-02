import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

type RequestWithCorrelation = Request & { correlationId: string };

/**
 * Middleware Express (primeiro na cadeia):
 * - gera ou propaga `X-Request-Id`;
 * - grava em `req.correlationId` para `LoggerInterceptor` e `HttpExceptionFilter` (`requestId` no JSON de erro).
 *
 * Logs de linha única ficam no `LoggerInterceptor` para evitar duplicação.
 */
export function applyHttpInstrumentation(app: INestApplication): void {
  const server = app.getHttpAdapter().getInstance() as {
    use: (
      fn: (req: Request, res: Response, next: NextFunction) => void,
    ) => void;
  };

  server.use((req: Request, res: Response, next: NextFunction) => {
    const raw = req.headers['x-request-id'];
    const correlationId =
      typeof raw === 'string' && raw.trim().length > 0
        ? raw.trim()
        : randomUUID();

    (req as RequestWithCorrelation).correlationId = correlationId;
    res.setHeader('x-request-id', correlationId);

    next();
  });
}
