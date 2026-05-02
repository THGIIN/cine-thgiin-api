import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

type RequestWithRequestId = Request & { correlationId?: string };

/**
 * Filtro global de erros — formato único para API e Swagger.
 * `requestId` replica o valor de `X-Request-Id` / `correlationId` (middleware).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithRequestId>();
    const requestId = request.correlationId ?? 'unknown';
    const path = request.originalUrl ?? request.url ?? '';
    const isProd = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = isProd
      ? 'Erro interno do servidor'
      : 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      error = this.httpErrorLabel(status);
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        error = (b.error as string) ?? error;
        message = (b.message as string | string[]) ?? exception.message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'Registro não encontrado';
      } else {
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = isProd ? 'Erro de persistência' : exception.message;
      }
    } else if (exception instanceof Error) {
      message = isProd ? 'Erro interno do servidor' : exception.message;
      this.logger.error(
        JSON.stringify({
          msg: 'unhandled_error',
          requestId,
          path,
          name: exception.name,
          stack: isProd ? undefined : exception.stack,
        }),
      );
    } else {
      this.logger.error(
        JSON.stringify({
          msg: 'unknown_throwable',
          requestId,
          path,
          type: typeof exception,
        }),
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path,
      message,
      error,
      requestId,
    });
  }

  private httpErrorLabel(status: number): string {
    const map: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
    };
    return map[status] ?? (status >= 500 ? 'Internal Server Error' : 'Error');
  }
}
