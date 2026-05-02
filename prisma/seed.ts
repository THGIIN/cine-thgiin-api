import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Nomes únicos — `Genre.name` é `@unique`, ideal para upsert. */
const GENRE_NAMES = [
  'Ação',
  'Drama',
  'Ficção científica',
  'Terror',
  'Comédia',
  'Aventura',
  'Romance',
  'Suspense',
  'Fantasia',
  'Animação',
] as const;

type SeedMovie = {
  title: string;
  description: string;
  releaseYear: number;
  rating: number;
  genres: (typeof GENRE_NAMES)[number][];
};

/**
 * Filmes reais com sinopses curtas — títulos e palavras úteis para testar `q`,
 * `genre`, `releaseYear`, `ratingMin` e ordenação.
 */
const MOVIES: SeedMovie[] = [
  {
    title: 'Interestelar',
    description:
      'Uma equipe de exploradores viaja por um buraco de minhoca em busca de um novo lar para a humanidade quando a Terra deixa de ser habitável.',
    releaseYear: 2014,
    rating: 8.7,
    genres: ['Ficção científica', 'Drama'],
  },
  {
    title: 'O Poderoso Chefão',
    description:
      'A saga da família Corleone no submundo do crime organizado em Nova York.',
    releaseYear: 1972,
    rating: 9.2,
    genres: ['Drama', 'Suspense'],
  },
  {
    title: 'Batman: O Cavaleiro das Trevas',
    description:
      'Batman enfrenta o Coringa, um anarquista que mergulha Gotham no caos.',
    releaseYear: 2008,
    rating: 9.0,
    genres: ['Ação', 'Drama'],
  },
  {
    title: 'Matrix',
    description:
      'Um programador descobre que a realidade é uma simulação controlada por máquinas.',
    releaseYear: 1999,
    rating: 8.7,
    genres: ['Ficção científica', 'Ação'],
  },
  {
    title: 'Parasita',
    description:
      'Uma família pobre infiltra a casa de uma família rica de forma inesperada.',
    releaseYear: 2019,
    rating: 8.5,
    genres: ['Drama', 'Suspense', 'Comédia'],
  },
  {
    title: 'Clube da Luta',
    description:
      'Um homem insone forma um clube de combate clandestino com um vendedor de sabão carismático.',
    releaseYear: 1999,
    rating: 8.8,
    genres: ['Drama'],
  },
  {
    title: 'O Senhor dos Anéis: A Sociedade do Anel',
    description:
      'Um hobbit recebe um anel mágico e inicia uma jornada para destruí-lo.',
    releaseYear: 2001,
    rating: 8.8,
    genres: ['Aventura', 'Fantasia'],
  },
  {
    title: 'Gladiador',
    description:
      'Um general romano traído vira gladiador e busca vingança contra o imperador corrupto.',
    releaseYear: 2000,
    rating: 8.5,
    genres: ['Ação', 'Drama'],
  },
  {
    title: 'O Regresso',
    description:
      'Um caçador de peles gravemente ferido luta para sobreviver e se vingar na fronteira americana.',
    releaseYear: 2015,
    rating: 8.0,
    genres: ['Aventura', 'Drama'],
  },
  {
    title: 'Django Livre',
    description:
      'Um caçador de recompensas liberta um escravo para resgatar sua esposa de um fazendeiro cruel.',
    releaseYear: 2012,
    rating: 8.4,
    genres: ['Ação', 'Drama', 'Suspense'],
  },
  {
    title: 'Vingadores: Ultimato',
    description:
      'Os heróis remanescentes unem forças para desfazer o estalo e restaurar o universo.',
    releaseYear: 2019,
    rating: 8.4,
    genres: ['Ação', 'Ficção científica', 'Aventura'],
  },
  {
    title: 'Toy Story',
    description:
      'Os brinquedos de um menino ganham vida quando ninguém está olhando.',
    releaseYear: 1995,
    rating: 8.3,
    genres: ['Animação', 'Comédia'],
  },
  {
    title: 'Se Beber, Não Case!',
    description:
      'Três amigos acordam sem lembrar da noite de despedida de solteiro em Las Vegas.',
    releaseYear: 2009,
    rating: 7.7,
    genres: ['Comédia'],
  },
  {
    title: 'Hereditário',
    description:
      'Após a morte da avó, uma família desenterra segredos aterrorizantes sobre sua linhagem.',
    releaseYear: 2018,
    rating: 7.3,
    genres: ['Terror', 'Suspense'],
  },
  {
    title: 'Coringa',
    description:
      'A origem sombria de Arthur Fleck, um comediante à beira do colapso em Gotham.',
    releaseYear: 2019,
    rating: 8.2,
    genres: ['Drama', 'Suspense'],
  },
  {
    title: 'Duna',
    description:
      'Paul Atreides lidera um povo nativo em um planeta desértico rico em recurso vital.',
    releaseYear: 2021,
    rating: 8.0,
    genres: ['Ficção científica', 'Aventura'],
  },
  {
    title: 'Nomadland',
    description:
      'Uma mulher perde tudo na recessão e viaja pelo oeste americano como nômade moderna.',
    releaseYear: 2020,
    rating: 7.3,
    genres: ['Drama', 'Romance'],
  },
  {
    title: 'Whiplash',
    description:
      'Um baterista de jazz enfrenta um professor brutalmente exigente em um conservatório.',
    releaseYear: 2014,
    rating: 8.5,
    genres: ['Drama', 'Suspense'],
  },
  {
    title: 'Mad Max: Estrada da Fúria',
    description:
      'Em um deserto pós-apocalíptico, Max ajuda a fugir de um tirano com um grupo de rebeldes.',
    releaseYear: 2015,
    rating: 8.1,
    genres: ['Ação', 'Aventura'],
  },
  {
    title: 'O Iluminado',
    description:
      'Um escritor aceita cuidar de um hotel isolado no inverno e sua família enfrenta o terror.',
    releaseYear: 1980,
    rating: 8.4,
    genres: ['Terror', 'Suspense'],
  },
  {
    title: 'La La Land',
    description:
      'Um pianista de jazz e uma aspirante a atriz se apaixonam enquanto perseguem seus sonhos em Los Angeles.',
    releaseYear: 2016,
    rating: 8.0,
    genres: ['Romance', 'Comédia', 'Drama'],
  },
  {
    title: 'Homem-Aranha: Sem Volta para Casa',
    description:
      'Peter Parker pede ajuda ao Doutor Estranho; feitiços abrem o multiverso com consequências fatais.',
    releaseYear: 2021,
    rating: 8.2,
    genres: ['Ação', 'Aventura', 'Ficção científica'],
  },
  {
    title: 'Gênio Indomável',
    description:
      'Um jovem problemático de Boston descobre seu talento para matemática com a ajuda de um terapeuta.',
    releaseYear: 1997,
    rating: 8.3,
    genres: ['Drama', 'Romance'],
  },
  {
    title: 'Pantera Negra',
    description:
      'T\'Challa retorna a Wakanda para assumir o trono e defender seu reino de inimigos.',
    releaseYear: 2018,
    rating: 7.3,
    genres: ['Ação', 'Ficção científica', 'Aventura'],
  },
  {
    title: 'Coco',
    description:
      'Miguel viaja à Terra dos Mortos para desvendar o mistério de sua família e sua paixão pela música.',
    releaseYear: 2017,
    rating: 8.4,
    genres: ['Animação', 'Aventura', 'Drama'],
  },
  {
    title: 'Jurassic Park',
    description:
      'Cientistas clonam dinossauros em um parque temático onde a natureza recupera o controle.',
    releaseYear: 1993,
    rating: 8.2,
    genres: ['Aventura', 'Ficção científica', 'Suspense'],
  },
  {
    title: 'À Espera de um Milagre',
    description:
      'No corredor da morte, um guarda conhece um condenado com um dom misterioso.',
    releaseYear: 1999,
    rating: 8.6,
    genres: ['Drama', 'Suspense'],
  },
  {
    title: 'Pulp Fiction',
    description:
      'Histórias entrelaçadas de criminosos, boxeadores e um casal de assaltantes em Los Angeles.',
    releaseYear: 1994,
    rating: 8.9,
    genres: ['Drama', 'Suspense', 'Comédia'],
  },
];

async function seedGenres(): Promise<void> {
  for (const name of GENRE_NAMES) {
    await prisma.genre.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}

async function upsertMovie(m: SeedMovie): Promise<void> {
  const genreRows = await Promise.all(
    m.genres.map((name) =>
      prisma.genre.findUniqueOrThrow({ where: { name } }),
    ),
  );
  const connect = genreRows.map((g) => ({ id: g.id }));

  const existing = await prisma.movie.findFirst({
    where: { title: m.title },
  });

  if (existing) {
    await prisma.movie.update({
      where: { id: existing.id },
      data: {
        description: m.description,
        releaseYear: m.releaseYear,
        rating: m.rating,
        deletedAt: null,
        genres: { set: connect },
      },
    });
    return;
  }

  await prisma.movie.create({
    data: {
      title: m.title,
      description: m.description,
      releaseYear: m.releaseYear,
      rating: m.rating,
      genres: { connect },
    },
  });
}

async function main(): Promise<void> {
  console.log('Cine Thgiin — seed iniciado…');
  await seedGenres();
  console.log(`Gêneros garantidos: ${GENRE_NAMES.length}.`);

  for (const m of MOVIES) {
    await upsertMovie(m);
  }

  const movieCount = await prisma.movie.count({ where: { deletedAt: null } });
  console.log(`Filmes ativos no banco: ${movieCount} (seed com ${MOVIES.length} títulos).`);
  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
