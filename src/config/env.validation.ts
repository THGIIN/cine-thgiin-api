import * as Joi from 'joi';

/**
 * Schema Joi carregado pelo ConfigModule na subida da aplicação.
 * Garante que PORT, DATABASE_URL e NODE_ENV existam e tenham formato esperado
 * antes de qualquer módulo (ex.: Prisma) depender dessas variáveis.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  /** Porta HTTP do Nest; default 3000 alinha com docker-compose e dev local */
  PORT: Joi.number().port().default(3000),
  /**
   * Connection string PostgreSQL do Prisma.
   * Joi.string() evita .uri() estrito (senhas com caracteres especiais em URLs).
   */
  DATABASE_URL: Joi.string().required().messages({
    'any.required':
      'DATABASE_URL é obrigatória para o Prisma conectar ao PostgreSQL',
  }),
  /** Lista separada por vírgula; vazio = reflete qualquer origem (dev). Em produção defina domínios explícitos. */
  CORS_ORIGIN: Joi.string().optional().allow(''),
});
