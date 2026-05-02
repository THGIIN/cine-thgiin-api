import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateMovieDto } from './create-movie.dto';

/** Atualização parcial; todos os campos de criação são opcionais. */
@ApiSchema({
  description:
    'Mesmos campos de criação, todos opcionais. Omitir um campo mantém o valor atual.',
})
export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
