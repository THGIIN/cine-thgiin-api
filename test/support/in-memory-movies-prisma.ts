import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';

type GenreRow = { id: string; name: string };

type MovieRow = {
  id: string;
  title: string;
  description: string | null;
  releaseYear: number;
  rating: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  genreIds: string[];
};

function matchesWhere(
  row: MovieRow,
  w: Prisma.MovieWhereInput,
  genresById: Map<string, GenreRow>,
): boolean {
  if (w.AND && Array.isArray(w.AND)) {
    return w.AND.every((part) => matchesWhere(row, part, genresById));
  }
  if (w.OR && Array.isArray(w.OR)) {
    return w.OR.some((part) => matchesWhere(row, part, genresById));
  }
  if (w.deletedAt === null) {
    if (row.deletedAt !== null) return false;
  }
  if (w.title && typeof w.title === 'object' && 'contains' in w.title) {
    const term = String(
      (w.title as { contains: string }).contains,
    ).toLowerCase();
    if (!row.title.toLowerCase().includes(term)) return false;
  }
  if (
    w.description &&
    typeof w.description === 'object' &&
    'contains' in w.description
  ) {
    const term = String(
      (w.description as { contains: string }).contains,
    ).toLowerCase();
    if (
      row.description === null ||
      !row.description.toLowerCase().includes(term)
    )
      return false;
  }
  if (typeof w.releaseYear === 'number') {
    if (row.releaseYear !== w.releaseYear) return false;
  }
  if (w.releaseYear && typeof w.releaseYear === 'object') {
    const y = w.releaseYear as { gte?: number; lte?: number };
    if (y.gte !== undefined && row.releaseYear < y.gte) return false;
    if (y.lte !== undefined && row.releaseYear > y.lte) return false;
  }
  if (w.rating && typeof w.rating === 'object' && 'gte' in w.rating) {
    const min = Number((w.rating as { gte: unknown }).gte);
    if (row.rating < min) return false;
  }
  if (w.genres && typeof w.genres === 'object' && 'some' in w.genres) {
    const some = (w.genres as { some: { name?: { equals?: string } } }).some;
    const want = some.name?.equals?.toLowerCase();
    if (want !== undefined) {
      const names = row.genreIds
        .map((id) => genresById.get(id)?.name)
        .filter((n): n is string => n !== undefined);
      if (!names.some((n) => n.toLowerCase() === want)) return false;
    }
  }
  return true;
}

function sortRows(
  rows: MovieRow[],
  orderBy: Prisma.MovieOrderByWithRelationInput,
): MovieRow[] {
  const copy = [...rows];
  const entries = Object.entries(orderBy as Record<string, string>);
  const [key, dir] = entries[0] ?? ['createdAt', 'desc'];
  const mult = dir === 'asc' ? 1 : -1;
  const sortKey = key as keyof Pick<
    MovieRow,
    'title' | 'releaseYear' | 'rating' | 'createdAt'
  >;
  if (
    sortKey === 'title' ||
    sortKey === 'releaseYear' ||
    sortKey === 'rating' ||
    sortKey === 'createdAt'
  ) {
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    });
  }
  return copy;
}

/**
 * Prisma parcial em memória para e2e: contrato usado por `MoviesService`
 * (create, findFirst, findMany, count, update, genre.upsert, transações).
 */
export function createInMemoryMoviesPrismaMock() {
  const movies = new Map<string, MovieRow>();
  const genresById = new Map<string, GenreRow>();
  const genreNameToId = new Map<string, string>();

  function getOrCreateGenre(name: string): GenreRow {
    const existingId = genreNameToId.get(name);
    if (existingId) {
      return genresById.get(existingId)!;
    }
    const id = randomUUID();
    const row: GenreRow = { id, name };
    genresById.set(id, row);
    genreNameToId.set(name, id);
    return row;
  }

  function genresForMovie(row: MovieRow): GenreRow[] {
    return row.genreIds
      .map((gid) => genresById.get(gid))
      .filter((g): g is GenreRow => g !== undefined);
  }

  const genre = {
    upsert: jest.fn(
      ({ where }: { where: { name: string }; create: { name: string } }) => {
        const name = where.name;
        return { ...getOrCreateGenre(name) };
      },
    ),
  };

  const movie = {
    create: jest.fn(
      ({
        data,
        include,
      }: {
        data: Prisma.MovieCreateInput;
        include?: { genres?: boolean };
      }) => {
        const id = randomUUID();
        const now = new Date();
        const genreIds: string[] = [];
        const nested = data.genres as
          | {
              connectOrCreate: {
                where: { name: string };
                create: { name: string };
              }[];
            }
          | undefined;
        if (nested?.connectOrCreate?.length) {
          for (const cc of nested.connectOrCreate) {
            const g = getOrCreateGenre(cc.where.name);
            if (!genreIds.includes(g.id)) genreIds.push(g.id);
          }
        }
        const row: MovieRow = {
          id,
          title: String(data.title),
          description:
            data.description === undefined || data.description === null
              ? null
              : String(data.description),
          releaseYear: Number(data.releaseYear),
          rating: Number(data.rating),
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
          genreIds,
        };
        movies.set(id, row);
        const payload = {
          id: row.id,
          title: row.title,
          description: row.description,
          releaseYear: row.releaseYear,
          rating: row.rating,
          deletedAt: row.deletedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
        if (include?.genres) {
          return { ...payload, genres: genresForMovie(row) };
        }
        return payload;
      },
    ),

    findFirst: jest.fn(
      ({
        where,
        include,
      }: {
        where: Prisma.MovieWhereInput;
        include?: { genres?: boolean };
      }) => {
        const w = where as { id?: string; deletedAt?: null };
        if (!w.id) return null;
        const row = movies.get(w.id);
        if (!row) return null;
        if (w.deletedAt === null && row.deletedAt !== null) return null;
        const base = {
          id: row.id,
          title: row.title,
          description: row.description,
          releaseYear: row.releaseYear,
          rating: row.rating,
          deletedAt: row.deletedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
        if (include?.genres) {
          return { ...base, genres: genresForMovie(row) };
        }
        return base;
      },
    ),

    findMany: jest.fn(
      ({
        where,
        skip,
        take,
        orderBy,
        include,
      }: {
        where: Prisma.MovieWhereInput;
        skip: number;
        take: number;
        orderBy: Prisma.MovieOrderByWithRelationInput;
        include?: { genres?: boolean };
      }) => {
        const filtered = Array.from(movies.values()).filter((r) =>
          matchesWhere(r, where, genresById),
        );
        const sorted = sortRows(filtered, orderBy);
        const slice = sorted.slice(skip, skip + take);
        return slice.map((row) => {
          const base = {
            id: row.id,
            title: row.title,
            description: row.description,
            releaseYear: row.releaseYear,
            rating: row.rating,
            deletedAt: row.deletedAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          };
          if (include?.genres) {
            return { ...base, genres: genresForMovie(row) };
          }
          return base;
        });
      },
    ),

    count: jest.fn(({ where }: { where: Prisma.MovieWhereInput }) => {
      const w = where as { id?: string };
      if (w.id !== undefined) {
        const row = movies.get(w.id);
        return row && matchesWhere(row, where, genresById) ? 1 : 0;
      }
      return Array.from(movies.values()).filter((r) =>
        matchesWhere(r, where, genresById),
      ).length;
    }),

    update: jest.fn(
      ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: Prisma.MovieUpdateInput;
        include?: { genres?: boolean };
      }) => {
        const prev = movies.get(where.id);
        if (!prev) throw new Error('Movie not found');
        const now = new Date();
        const nextGenreIds = [...prev.genreIds];
        if (
          data.genres &&
          typeof data.genres === 'object' &&
          'set' in data.genres
        ) {
          const set = (data.genres as { set: { id: string }[] }).set;
          nextGenreIds.length = 0;
          for (const s of set) {
            const g = genresById.get(s.id);
            if (g && !nextGenreIds.includes(g.id)) nextGenreIds.push(g.id);
          }
        }
        const nextDescription =
          data.description === undefined
            ? prev.description
            : data.description === null
              ? null
              : typeof data.description === 'string'
                ? data.description
                : typeof data.description === 'object' &&
                    data.description !== null &&
                    'set' in data.description
                  ? (data.description as { set: string | null }).set
                  : prev.description;

        const next: MovieRow = {
          ...prev,
          title: typeof data.title === 'string' ? data.title : prev.title,
          description: nextDescription,
          releaseYear:
            data.releaseYear !== undefined
              ? Number(data.releaseYear)
              : prev.releaseYear,
          rating: data.rating !== undefined ? Number(data.rating) : prev.rating,
          deletedAt:
            data.deletedAt === undefined
              ? prev.deletedAt
              : (data.deletedAt as Date | null),
          updatedAt: now,
          genreIds: nextGenreIds,
        };
        movies.set(where.id, next);
        const base = {
          id: next.id,
          title: next.title,
          description: next.description,
          releaseYear: next.releaseYear,
          rating: next.rating,
          deletedAt: next.deletedAt,
          createdAt: next.createdAt,
          updatedAt: next.updatedAt,
        };
        if (include?.genres) {
          return { ...base, genres: genresForMovie(next) };
        }
        return base;
      },
    ),
  };

  const prisma = {
    onModuleInit: () => Promise.resolve(),
    onModuleDestroy: () => Promise.resolve(),
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    movie,
    genre,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  return { prisma, movies, genresById };
}
