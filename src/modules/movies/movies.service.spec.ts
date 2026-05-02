import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { MoviesListSortBy, MoviesSortOrder } from './dto/list-movies.query.dto';

describe('MoviesService', () => {
  let service: MoviesService;
  let prisma: {
    movie: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    genre: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };

  const genreA = { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Drama' };
  const baseMovie = {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Teste',
    description: 'Sinopse',
    releaseYear: 2000,
    rating: 8.5,
    deletedAt: null,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    genres: [genreA],
  };

  beforeEach(async () => {
    const mockPrisma = {
      movie: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      genre: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = moduleRef.get(MoviesService);
    prisma = moduleRef.get(PrismaService);
  });

  describe('list', () => {
    it('lança BadRequestException quando intervalo de anos é inválido', async () => {
      await expect(
        service.list({
          releaseYearFrom: 2010,
          releaseYearTo: 2000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('usa $transaction com findMany + count e retorna data + meta', async () => {
      prisma.movie.findMany.mockResolvedValue([baseMovie]);
      prisma.movie.count.mockResolvedValue(1);

      const out = await service.list({
        page: 1,
        limit: 10,
        sortBy: MoviesListSortBy.TITLE,
        sortOrder: MoviesSortOrder.ASC,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(out.meta).toEqual({
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      });
      expect(out.data).toHaveLength(1);
      expect(out.data[0]?.title).toBe('Teste');
      expect(out.data[0]).not.toHaveProperty('deletedAt');
      expect(prisma.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { title: Prisma.SortOrder.asc },
          include: { genres: true },
        }),
      );
      const findManyMock = prisma.movie.findMany as jest.MockedFunction<
        (args: {
          where: Prisma.MovieWhereInput;
          skip: number;
          take: number;
          orderBy: unknown;
          include: unknown;
        }) => Promise<unknown>
      >;
      const firstArgs = findManyMock.mock.calls[0]?.[0];
      expect(firstArgs).toBeDefined();
      expect(prisma.movie.count).toHaveBeenCalledWith({
        where: firstArgs.where,
      });
    });
  });

  describe('create', () => {
    it('persiste com genres connectOrCreate e devolve resposta mapeada', async () => {
      prisma.movie.create.mockResolvedValue(baseMovie);
      const dto: CreateMovieDto = {
        title: 'Teste',
        description: 'Sinopse',
        genres: ['Drama'],
        releaseYear: 2000,
        rating: 8.5,
      };

      const result = await service.create(dto);

      expect(prisma.movie.create).toHaveBeenCalledWith({
        data: {
          title: 'Teste',
          description: 'Sinopse',
          releaseYear: 2000,
          rating: 8.5,
          genres: {
            connectOrCreate: [
              { where: { name: 'Drama' }, create: { name: 'Drama' } },
            ],
          },
        },
        include: { genres: true },
      });
      expect(result.rating).toBe(8.5);
      expect(result.title).toBe('Teste');
      expect(result.genres).toEqual([{ id: genreA.id, name: 'Drama' }]);
    });

    it('omite genres no Prisma quando array vazio ou ausente', async () => {
      prisma.movie.create.mockResolvedValue({ ...baseMovie, genres: [] });
      const dto: CreateMovieDto = {
        title: 'Só título',
        releaseYear: 1999,
        rating: 7,
      };

      await service.create(dto);

      expect(prisma.movie.create).toHaveBeenCalledWith({
        data: {
          title: 'Só título',
          description: undefined,
          releaseYear: 1999,
          rating: 7,
        },
        include: { genres: true },
      });
    });

    it('propaga erro do Prisma', async () => {
      prisma.movie.create.mockRejectedValue(new Error('db indisponível'));
      const dto: CreateMovieDto = {
        title: 'X',
        releaseYear: 2000,
        rating: 1,
      };

      await expect(service.create(dto)).rejects.toThrow('db indisponível');
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando não existe', async () => {
      prisma.movie.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('22222222-2222-2222-2222-222222222222'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('retorna filme quando encontrado', async () => {
      prisma.movie.findFirst.mockResolvedValue(baseMovie);

      const result = await service.findOne(baseMovie.id);

      expect(result.id).toBe(baseMovie.id);
      expect(result.genres).toEqual([{ id: genreA.id, name: 'Drama' }]);
    });
  });

  describe('update', () => {
    it('lança NotFoundException quando ensureExists falha', async () => {
      prisma.movie.count.mockResolvedValue(0);

      await expect(
        service.update('33333333-3333-3333-3333-333333333333', {
          title: 'Novo',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.movie.update).not.toHaveBeenCalled();
    });

    it('atualiza campos escalares e retorna filme', async () => {
      prisma.movie.count.mockResolvedValue(1);
      const updated = { ...baseMovie, title: 'Novo título' };
      prisma.movie.update.mockResolvedValue(updated);

      const result = await service.update(baseMovie.id, {
        title: 'Novo título',
      });

      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: baseMovie.id },
        data: { title: 'Novo título' },
        include: { genres: true },
      });
      expect(result.title).toBe('Novo título');
    });

    it('com genres chama upsert e set no update', async () => {
      prisma.movie.count.mockResolvedValue(1);
      prisma.genre.upsert
        .mockResolvedValueOnce({ id: genreA.id, name: 'Drama' })
        .mockResolvedValueOnce({
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          name: 'Ação',
        });
      prisma.movie.update.mockResolvedValue({
        ...baseMovie,
        genres: [
          genreA,
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Ação' },
        ],
      });

      await service.update(baseMovie.id, { genres: ['Drama', 'Ação'] });

      expect(prisma.genre.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: baseMovie.id },
        data: {
          genres: {
            set: [
              { id: genreA.id },
              { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
            ],
          },
        },
        include: { genres: true },
      });
    });

    it('sem campos no DTO chama findOne', async () => {
      prisma.movie.count.mockResolvedValue(1);
      prisma.movie.findFirst.mockResolvedValue(baseMovie);

      const result = await service.update(baseMovie.id, {});

      expect(prisma.movie.update).not.toHaveBeenCalled();
      expect(result.id).toBe(baseMovie.id);
    });
  });

  describe('remove (soft delete)', () => {
    it('lança NotFoundException quando filme não existe', async () => {
      prisma.movie.count.mockResolvedValue(0);

      await expect(
        service.remove('44444444-4444-4444-4444-444444444444'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.movie.update).not.toHaveBeenCalled();
    });

    it('chama update com deletedAt', async () => {
      prisma.movie.count.mockResolvedValue(1);
      prisma.movie.update.mockResolvedValue({
        ...baseMovie,
        deletedAt: new Date(),
      });

      const result = await service.remove(baseMovie.id);

      expect(result).toBeUndefined();
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: baseMovie.id },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });
  });
});
