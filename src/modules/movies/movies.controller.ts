import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { ApiValidationErrorResponseDto } from './dto/api-error.response.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { GenreItemDto } from './dto/genre-item.dto';
import { ListMoviesQueryDto } from './dto/list-movies.query.dto';
import { MovieListItemDto } from './dto/movie-list-item.dto';
import { MovieResponseDto } from './dto/movie-response.dto';
import {
  MoviesListMetaDto,
  MoviesListResponseDto,
} from './dto/movies-list-response.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

const LIST_MOVIES_DOC = `
Lista **apenas** filmes ativos (\`deletedAt\` nulo). Cada item em \`data\` inclui **genres** (N:N).
Corpo: \`{ "data": [...], "meta": { page, limit, totalItems, totalPages } }\`.

**Exemplo de query:**  
\`GET /api/v1/movies?page=2&limit=15&q=guerra&genre=drama&releaseYearFrom=2000&releaseYearTo=2020&ratingMin=7&sortBy=rating&sortOrder=desc\`

### Paginação
| Parâmetro | Default | Observação |
|-----------|---------|------------|
| \`page\` | 1 | inteiro ≥ 1 |
| \`limit\` | 10 | 1 ≤ limit ≤ **50** |

### Busca (\`q\`)
- \`contains\` + \`mode: insensitive\` em **title** OR **description**.

### Filtros (AND entre si)
- \`genre\`: \`genres.some.name\`, case-insensitive.
- \`releaseYear\`: igualdade exata; **se enviado**, ignora intervalo.
- \`releaseYearFrom\` / \`releaseYearTo\`: \`gte\` / \`lte\` em \`releaseYear\`.
- \`ratingMin\`: \`rating >= ratingMin\`.

### Ordenação
- \`sortBy\`: \`title\`, \`releaseYear\`, \`rating\`, \`createdAt\` — default **createdAt**.
- \`sortOrder\`: \`asc\`, \`desc\` — default **desc**.

### Performance
- \`findMany\` e \`count\` no mesmo \`$transaction\`, com o mesmo \`where\`.
`.trim();

@ApiTags('movies')
@ApiProduces('application/json')
@ApiExtraModels(
  MovieResponseDto,
  GenreItemDto,
  ApiValidationErrorResponseDto,
  CreateMovieDto,
  UpdateMovieDto,
  ListMoviesQueryDto,
  MovieListItemDto,
  MoviesListResponseDto,
  MoviesListMetaDto,
)
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar filme',
    description:
      'Cria um filme ativo. Obrigatórios: `title`, `releaseYear`, `rating`. `description` e `genres` (nomes) são opcionais. Gêneros inexistentes são criados; a resposta inclui `genres` com `id` e `name`.',
  })
  @ApiBody({
    type: CreateMovieDto,
    examples: {
      exemplo: {
        summary: 'Com gêneros',
        value: {
          title: 'Cidadão Kane',
          description: 'A vida de um magnata da imprensa.',
          genres: ['Drama', 'Mistério'],
          releaseYear: 1941,
          rating: 9.2,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description:
      '**201** — Filme criado. Corpo espelha o registro salvo (mesmo contrato de `GET /movies/:id`).',
    type: MovieResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      '**400** — Corpo inválido (`ValidationPipe`: campos fora dos limites, tipos errados ou campos não permitidos).',
    type: ApiValidationErrorResponseDto,
  })
  create(@Body() dto: CreateMovieDto) {
    return this.moviesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar filmes (paginado)',
    description: LIST_MOVIES_DOC,
  })
  @ApiOkResponse({
    description:
      '**200** — `data`: array de itens ativos (`MovieListItemDto`, sem `deletedAt`); `meta`: paginação. `totalPages` é **0** quando `totalItems` é 0.',
    type: MoviesListResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      '**400** — Query inválida (tipos, limites, intervalo de anos invertido) ou parâmetros não permitidos.',
    type: ApiValidationErrorResponseDto,
  })
  findAll(@Query() query: ListMoviesQueryDto) {
    return this.moviesService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter filme por id',
    description:
      'Retorna um filme **ativo** (`deletedAt` nulo) com `genres`. Soft-deleted ou id inexistente → **404**.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador UUID v4 do filme.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: '**200** — Filme encontrado.',
    type: MovieResponseDto,
  })
  @ApiBadRequestResponse({
    description: '**400** — `id` não é um UUID válido.',
    type: ApiValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      '**404** — Não existe filme com esse id, ou está **soft-deleted**.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.moviesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar filme (parcial)',
    description:
      'Atualização parcial. Se `genres` for enviado (inclusive array vazio), **substitui** todos os gêneros do filme. Corpo vazio → **200** sem alterações.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador UUID do filme ativo a atualizar.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateMovieDto,
    examples: {
      nota: {
        summary: 'Atualizar só a nota',
        value: { rating: 8.5 },
      },
      generos: {
        summary: 'Substituir gêneros',
        value: { genres: ['Ficção científica', 'Aventura'] },
      },
    },
  })
  @ApiOkResponse({
    description: '**200** — Filme atualizado (ou inalterado se body vazio).',
    type: MovieResponseDto,
  })
  @ApiBadRequestResponse({
    description: '**400** — UUID inválido ou corpo de validação rejeitado.',
    type: ApiValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '**404** — Filme inexistente ou soft-deleted.',
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMovieDto) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover filme (soft delete)',
    description:
      'Define `deletedAt` com timestamp atual; **a linha permanece** no banco. Resposta **204 No Content** sem corpo — use `GET /movies/:id` para confirmar: retorna **404** quando soft-deleted.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Identificador UUID do filme a marcar como removido.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiNoContentResponse({
    description: '**204** — Soft delete aplicado; sem corpo na resposta.',
  })
  @ApiBadRequestResponse({
    description: '**400** — `id` não é um UUID válido.',
    type: ApiValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '**404** — Filme inexistente ou já estava soft-deleted.',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.moviesService.remove(id);
  }
}
