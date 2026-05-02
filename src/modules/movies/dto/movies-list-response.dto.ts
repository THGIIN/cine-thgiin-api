import { ApiProperty } from '@nestjs/swagger';
import { MovieListItemDto } from './movie-list-item.dto';

export class MoviesListMetaDto {
  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 10, minimum: 1 })
  limit!: number;

  @ApiProperty({
    example: 100,
    description: 'Total de filmes que batem com o filtro (ativos).',
  })
  totalItems!: number;

  @ApiProperty({
    example: 10,
    description: 'Total de páginas; **0** quando `totalItems` é 0.',
  })
  totalPages!: number;
}

/**
 * Listagem paginada — formato pensado para consumo por frontends (`data` + `meta`).
 */
export class MoviesListResponseDto {
  @ApiProperty({
    type: () => [MovieListItemDto],
    description:
      'Filmes ativos (soft-deleted excluídos no `where`), cada item com `genres` incluídos.',
  })
  data!: MovieListItemDto[];

  @ApiProperty({ type: () => MoviesListMetaDto })
  meta!: MoviesListMetaDto;
}
