/**
 * Executado antes dos testes Jest: define env mínimas para ConfigModule + Prisma
 * quando não há .env no CI ou sandbox (valores alinhados ao docker-compose local).
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/cinearquivo?schema=public';
