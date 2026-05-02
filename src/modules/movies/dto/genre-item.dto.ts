import { ApiProperty } from '@nestjs/swagger';

/** Item de gênero na resposta (relação N:N com `Movie`). */
export class GenreItemDto {
  @ApiProperty({
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({ example: 'Drama' })
  name!: string;
}
