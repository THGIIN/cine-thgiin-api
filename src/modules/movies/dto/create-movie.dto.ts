import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Criação de filme com gêneros opcionais (nomes; `connectOrCreate` no service).
 * - `title`, `releaseYear`, `rating` obrigatórios.
 * - `description` e `genres` opcionais.
 */
export class CreateMovieDto {
  @ApiProperty({ example: 'Cidadão Kane', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Descrição / sinopse opcional.',
    example: 'A vida de um magnata da imprensa...',
    maxLength: 8000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @ApiPropertyOptional({
    description:
      'Nomes dos gêneros (único por nome no catálogo). Duplicatas no array são ignoradas.',
    type: [String],
    example: ['Drama', 'Mistério'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  genres?: string[];

  @ApiProperty({ example: 1941, minimum: 1888, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYear!: number;

  @ApiProperty({
    description: 'Nota de 0 a 10 (até uma casa decimal).',
    example: 9.2,
    minimum: 0,
    maximum: 10,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  rating!: number;
}
