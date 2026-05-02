import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

type RequestWithRequestId = Request & { correlationId?: string };

/**
 * Log de acesso legível no console + correlação com `X-Request-Id` / erros.
 * Formato: `[MÉTODO] [URL] [STATUS] [tempo ms] [requestId]`
 */
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<RequestWithRequestId>();
    const res = context.switchToHttp().getResponse<Response>();
    const started = Date.now();
    const method = req.method;
    const url = req.originalUrl ?? req.url ?? '';
    const requestId = req.correlationId ?? '—';

    return next.handle().pipe(
      tap({
        finalize: () => {
          const ms = Date.now() - started;
          const status = res.statusCode;
          const line = `[${method}] [${url}] [${status}] [${ms}ms] [${requestId}]`;
          this.logger.log(line);
        },
      }),
    );
  }
}
