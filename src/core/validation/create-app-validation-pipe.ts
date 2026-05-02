import { ValidationPipe } from '@nestjs/common';

/**
 * `ValidationPipe` global único — regras alinhadas a API pública:
 * whitelist, rejeição de campos extras, transformação de tipos e conversão implícita.
 */
export function createAppValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
}
