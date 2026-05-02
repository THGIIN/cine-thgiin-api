import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Genre, Movie, Prisma } from '@prisma/client';
import { PrismaService } from '@common/database/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import {
  ListMoviesQueryDto,
  MoviesListSortBy,
  MoviesSortOrder,
} from './dto/list-movies.query.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

type MovieWithGenres = Movie & { genres: Genre[] };

function toMovieResponse(movie: MovieWithGenres) {
  const genres = [...movie.genres].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt'),
  );
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    releaseYear: movie.releaseYear,
    rating: movie.rating,
    deletedAt: movie.deletedAt,
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
    genres: genres.map((g) => ({ id: g.id, name: g.name })),
  };
}

/** Item da listagem — sem `deletedAt` (contrato público para grids / tabelas). */
function toMovieListItem(movie: MovieWithGenres) {
  const r = toMovieResponse(movie);
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    releaseYear: r.releaseYear,
    rating: r.rating,
    genres: r.genres,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listagem paginada: filtros combináveis, busca em título/descrição, ordenação.
   * `findMany` + `count` na mesma transação com o mesmo `where` (sem soft-deleted).
   */
  async list(query: ListMoviesQueryDto) {
    if (
      query.releaseYearFrom !== undefined &&
      query.releaseYearTo !== undefined &&
      query.releaseYearFrom > query.releaseYearTo
    ) {
      throw new BadRequestException(
        'releaseYearFrom não pode ser maior que releaseYearTo',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? MoviesListSortBy.CREATED_AT;
    const sortOrder = query.sortOrder ?? MoviesSortOrder.DESC;

    const where = this.buildListWhere(query);
    const orderBy = this.buildListOrderBy(sortBy, sortOrder);
    const skip = (page - 1) * limit;

    const [rows, totalItems] = await this.prisma.$transaction([
      this.prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { genres: true },
      }),
      this.prisma.movie.count({ where }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return {
      data: rows.map(toMovieListItem),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Monta o `where` de forma incremental: cada filtro opcional vira uma chave no objeto,
   * combinada com AND implícito do Prisma (todas as condições devem ser verdadeiras).
   */
  private buildListWhere(query: ListMoviesQueryDto): Prisma.MovieWhereInput {
    const q = query.q?.trim();
    const genreName = query.genre?.trim();

    const releaseYearFilter:
      | number
      | { gte?: number; lte?: number }
      | undefined =
      query.releaseYear !== undefined
        ? query.releaseYear
        : query.releaseYearFrom !== undefined ||
            query.releaseYearTo !== undefined
          ? {
              ...(query.releaseYearFrom !== undefined && {
                gte: query.releaseYearFrom,
              }),
              ...(query.releaseYearTo !== undefined && {
                lte: query.releaseYearTo,
              }),
            }
          : undefined;

    return {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(genreName
        ? {
            genres: {
              some: {
                name: { equals: genreName, mode: 'insensitive' },
              },
            },
          }
        : {}),
      ...(releaseYearFilter !== undefined
        ? { releaseYear: releaseYearFilter }
        : {}),
      ...(query.ratingMin !== undefined
        ? { rating: { gte: query.ratingMin } }
        : {}),
    };
  }

  private buildListOrderBy(
    sortBy: MoviesListSortBy,
    sortOrder: MoviesSortOrder,
  ): Prisma.MovieOrderByWithRelationInput {
    const dir =
      sortOrder === MoviesSortOrder.ASC
        ? Prisma.SortOrder.asc
        : Prisma.SortOrder.desc;

    switch (sortBy) {
      case MoviesListSortBy.TITLE:
        return { title: dir };
      case MoviesListSortBy.RELEASE_YEAR:
        return { releaseYear: dir };
      case MoviesListSortBy.RATING:
        return { rating: dir };
      case MoviesListSortBy.CREATED_AT:
      default:
        return { createdAt: dir };
    }
  }

  async create(dto: CreateMovieDto) {
    const connectOrCreate = this.buildConnectOrCreate(dto.genres);
    const movie = await this.prisma.movie.create({
      data: {
        title: dto.title,
        description: dto.description,
        releaseYear: dto.releaseYear,
        rating: dto.rating,
        ...(connectOrCreate.length > 0 && {
          genres: { connectOrCreate },
        }),
      },
      include: { genres: true },
    });
    return toMovieResponse(movie);
  }

  async findOne(id: string) {
    const movie = await this.prisma.movie.findFirst({
      where: { id, deletedAt: null },
      include: { genres: true },
    });
    if (!movie) {
      throw new NotFoundException(`Filme com id ${id} não encontrado`);
    }
    return toMovieResponse(movie);
  }

  async update(id: string, dto: UpdateMovieDto) {
    await this.ensureExists(id);

    const scalarData: Prisma.MovieUpdateInput = {};
    if (dto.title !== undefined) scalarData.title = dto.title;
    if (dto.description !== undefined) scalarData.description = dto.description;
    if (dto.releaseYear !== undefined) scalarData.releaseYear = dto.releaseYear;
    if (dto.rating !== undefined) scalarData.rating = dto.rating;

    let genresData: Prisma.GenreUpdateManyWithoutMoviesNestedInput | undefined;
    if (dto.genres !== undefined) {
      const connectOrCreate = this.buildConnectOrCreate(dto.genres);
      const resolved = await Promise.all(
        connectOrCreate.map((c) =>
          this.prisma.genre.upsert({
            where: { name: c.where.name },
            create: c.create,
            update: {},
          }),
        ),
      );
      genresData = {
        set: resolved.map((g) => ({ id: g.id })),
      };
    }

    const hasScalars = Object.keys(scalarData).length > 0;
    if (!hasScalars && !genresData) {
      return this.findOne(id);
    }

    const movie = await this.prisma.movie.update({
      where: { id },
      data: {
        ...scalarData,
        ...(genresData && { genres: genresData }),
      },
      include: { genres: true },
    });
    return toMovieResponse(movie);
  }

  /** Soft delete: preenche `deletedAt` sem remover a linha (API responde 204 sem corpo). */
  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.movie.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private buildConnectOrCreate(
    names: string[] | undefined,
  ): Prisma.GenreCreateOrConnectWithoutMoviesInput[] {
    if (!names?.length) return [];
    const seen = new Set<string>();
    const out: Prisma.GenreCreateOrConnectWithoutMoviesInput[] = [];
    for (const raw of names) {
      const name = raw.trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({
        where: { name },
        create: { name },
      });
    }
    return out;
  }

  private async ensureExists(id: string): Promise<void> {
    const count = await this.prisma.movie.count({
      where: { id, deletedAt: null },
    });
    if (count === 0) {
      throw new NotFoundException(`Filme com id ${id} não encontrado`);
    }
  }
}
