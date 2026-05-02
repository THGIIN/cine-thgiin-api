import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenreItemDto } from './genre-item.dto';

/**
 * Corpo JSON retornado pela API para um filme.
 * `genres` reflete a relação N:N (ordenado por nome).
 */
export class MovieResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({ example: 'Cidadão Kane' })
  title!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Descrição; `null` se não informada.',
    example: 'A ascensão e queda de Charles Foster Kane.',
  })
  description!: string | null;

  @ApiProperty({
    type: () => [GenreItemDto],
    description: 'Gêneros associados (N:N).',
  })
  genres!: GenreItemDto[];

  @ApiProperty({ example: 1941, minimum: 1888, maximum: 2100 })
  releaseYear!: number;

  @ApiProperty({
    description: 'Nota 0–10 (número na resposta JSON).',
    example: 9.2,
    minimum: 0,
    maximum: 10,
  })
  rating!: number;

  @ApiPropertyOptional({
    nullable: true,
    format: 'date-time',
    description:
      'Preenchido após soft delete (`DELETE /movies/:id`). `null` enquanto ativo.',
    example: '2026-04-30T12:00:00.000Z',
  })
  deletedAt!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-04-30T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-04-30T10:30:00.000Z' })
  updatedAt!: string;
}
