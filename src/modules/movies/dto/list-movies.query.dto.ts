import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum MoviesListSortBy {
  TITLE = 'title',
  RELEASE_YEAR = 'releaseYear',
  RATING = 'rating',
  CREATED_AT = 'createdAt',
}

export enum MoviesSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Query string de `GET /movies` — filtros opcionais combináveis (AND).
 *
 * **Precedência de ano:** se `releaseYear` for enviado, o intervalo
 * `releaseYearFrom` / `releaseYearTo` é ignorado.
 */
export class ListMoviesQueryDto {
  @ApiPropertyOptional({
    description: 'Página (base 1).',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Itens por página (máximo 50).',
    default: 10,
    minimum: 1,
    maximum: 50,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Busca em **título** ou **descrição** (`contains`, case-insensitive). OR entre os dois campos. Valor vazio após trim é ignorado.',
    example: 'matrix',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  q?: string;

  @ApiPropertyOptional({
    description:
      'Filtra filmes que tenham pelo menos um gênero com este nome (relação N:N, `genres.some`, case-insensitive).',
    example: 'Ação',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  genre?: string;

  @ApiPropertyOptional({
    description:
      'Ano de lançamento exato. **Se presente**, ignora `releaseYearFrom` e `releaseYearTo`.',
    example: 1999,
    minimum: 1888,
    maximum: 2100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYear?: number;

  @ApiPropertyOptional({
    description:
      'Início do intervalo de `releaseYear` (inclusivo, `gte`). Usado com `releaseYearTo` ou sozinho.',
    example: 1990,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYearFrom?: number;

  @ApiPropertyOptional({
    description:
      'Fim do intervalo de `releaseYear` (inclusivo, `lte`). Usado com `releaseYearFrom` ou sozinho.',
    example: 2010,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYearTo?: number;

  @ApiPropertyOptional({
    description: 'Nota mínima: `rating >= ratingMin` (0–10).',
    example: 7.5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  ratingMin?: number;

  @ApiPropertyOptional({
    description:
      'Campo para ordenação. Padrão quando omitido: **createdAt** (combinado com `sortOrder` default **desc**).',
    enum: MoviesListSortBy,
    enumName: 'MoviesListSortBy',
    example: MoviesListSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(MoviesListSortBy)
  sortBy?: MoviesListSortBy;

  @ApiPropertyOptional({
    description: 'Direção da ordenação. Padrão: **desc**.',
    enum: MoviesSortOrder,
    enumName: 'MoviesSortOrder',
    example: MoviesSortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(MoviesSortOrder)
  sortOrder?: MoviesSortOrder;
}
