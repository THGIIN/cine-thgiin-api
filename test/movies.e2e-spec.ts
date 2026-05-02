import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/common/database/prisma.service';
import { createInMemoryMoviesPrismaMock } from './support/in-memory-movies-prisma';

describe('Movies (e2e, Prisma em memória)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const { prisma } = createInMemoryMoviesPrismaMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('fluxo CRUD: POST com gêneros, GET por id, PATCH, DELETE 204 e GET 404', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/movies')
      .send({
        title: 'Matrix Reloaded',
        description: 'Neo continua a jornada na Matrix.',
        genres: ['Ficção científica', 'Ação'],
        releaseYear: 2003,
        rating: 7.2,
      })
      .expect(201);

    const body = createRes.body as {
      id: string;
      title: string;
      genres: { id: string; name: string }[];
    };
    expect(body.title).toBe('Matrix Reloaded');
    expect(body.genres.map((g) => g.name).sort()).toEqual(
      ['Ação', 'Ficção científica'].sort(),
    );
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    const id = body.id;

    await request(app.getHttpServer())
      .get(`/api/v1/movies/${id}`)
      .expect(200)
      .expect((res) => {
        const m = res.body as { id: string; rating: number; genres: unknown[] };
        expect(m.id).toBe(id);
        expect(m.rating).toBe(7.2);
        expect(Array.isArray(m.genres)).toBe(true);
        expect(m.genres as { name: string }[]).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/movies/${id}`)
      .send({ rating: 8 })
      .expect(200)
      .expect((res) => {
        expect((res.body as { rating: number }).rating).toBe(8);
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/movies/${id}`)
      .expect(204);

    await request(app.getHttpServer()).get(`/api/v1/movies/${id}`).expect(404);
  });

  it('GET /api/v1/movies: paginação, formato data+meta e filtro por gênero', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/movies')
      .send({
        title: 'Outro filme',
        description: 'Texto de busca único xyz123',
        genres: ['Drama'],
        releaseYear: 2010,
        rating: 9,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/movies?page=1&limit=50')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          data: unknown[];
          meta: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
          };
        };
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(1);
        expect(body.meta).toMatchObject({
          page: 1,
          limit: 50,
          totalItems: 1,
          totalPages: 1,
        });
        expect(body.data).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .get(
        '/api/v1/movies?q=xyz123&genre=drama&sortBy=releaseYear&sortOrder=desc',
      )
      .expect(200)
      .expect((res) => {
        const body = res.body as { data: { title: string }[] };
        expect(body.data.some((m) => m.title === 'Outro filme')).toBe(true);
      });
  });
});
