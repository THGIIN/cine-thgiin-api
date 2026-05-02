import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenreItemDto } from './genre-item.dto';

/**
 * Item em `GET /movies` — mesmo domínio que `MovieResponseDto`, sem `deletedAt`
 * (listagem só retorna ativos).
 */
export class MovieListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Matrix' })
  title!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Descrição; `null` se não houver.',
  })
  description!: string | null;

  @ApiProperty({ example: 1999 })
  releaseYear!: number;

  @ApiProperty({ example: 8.7, minimum: 0, maximum: 10 })
  rating!: number;

  @ApiProperty({ type: () => [GenreItemDto] })
  genres!: GenreItemDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
