import { INestApplication, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { applyBasicSecurityMiddleware } from '@core/http/apply-basic-security.middleware';
import { applyHttpInstrumentation } from '@core/http/apply-http-instrumentation';
import { createAppValidationPipe } from '@core/validation/create-app-validation-pipe';

/**
 * Configuração HTTP compartilhada entre `main.ts` e testes e2e:
 * segurança (CORS), `X-Request-Id` (middleware), prefixo, validação global, Swagger em `/docs`.
 * Logs de acesso: `LoggerInterceptor` (console).
 */
export function configureApp(app: INestApplication): void {
  const expressApp = app.getHttpAdapter().getInstance() as {
    use: (...args: unknown[]) => void;
  };

  applyBasicSecurityMiddleware(expressApp);

  /** Correlação + log estruturado por requisição (antes das rotas versionadas). */
  applyHttpInstrumentation(app);

  const corsOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'docs', method: RequestMethod.ALL },
      { path: 'docs-json', method: RequestMethod.ALL },
      { path: 'docs-yaml', method: RequestMethod.ALL },
    ],
  });

  app.useGlobalPipes(createAppValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cine Thgiin API')
    .setDescription(
      [
        'API REST **Cine Thgiin** — catálogo de filmes com CRUD, listagem paginada, filtros e busca textual.',
        '',
        '### Base path',
        'Rotas de negócio: **`/api/v1`** (ex.: `GET /api/v1/movies`).',
        '',
        '### Documentação interativa',
        'Interface Swagger UI: **`/docs`**. OpenAPI JSON: **`/docs-json`**.',
        '',
        '### Erros padronizados',
        'Respostas de erro seguem o formato global: `statusCode`, `timestamp`, `path`, `message`, `error`, `requestId` (ecoando `X-Request-Id`).',
        '',
        '### Autenticação (roadmap)',
        '**JWT Bearer** (`Authorization: Bearer <token>`) é o caminho natural para proteger mutações; esta versão **não valida** token — veja o cadeado “Authorize” no Swagger para testes futuros.',
        '',
        '### Rate limiting (roadmap)',
        'Para limite por IP em produção, o padrão de mercado é `@nestjs/throttler` (ou API Gateway). Ainda não está ligado nesta build para manter dependências mínimas.',
        '',
        '### Soft delete',
        '`DELETE /movies/:id` → **204** sem corpo; registro permanece com `deletedAt`.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addTag('health', 'Disponibilidade do serviço')
    .addTag('movies', 'Filmes — CRUD, listagem e filtros')
    .addServer('/api/v1', 'API versionada (prefixo Nest)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Opcional / planejado: JWT (ex.: `@nestjs/jwt` + `@nestjs/passport`, guard em `POST/PATCH/DELETE`). Não obrigatório nesta build.',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Cine Thgiin — API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      syntaxHighlight: { activate: true, theme: 'monokai' },
    },
  });
}
