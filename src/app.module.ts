import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from '@config/env.validation';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LoggerInterceptor } from '@common/interceptors/logger.interceptor';
import { SecurityHeadersInterceptor } from '@core/interceptors/security-headers.interceptor';
import { PrismaModule } from '@common/database/prisma.module';
import { HealthModule } from '@modules/health/health.module';
import { MoviesModule } from '@modules/movies/movies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
    HealthModule,
    MoviesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SecurityHeadersInterceptor },
  ],
})
export class AppModule {}
