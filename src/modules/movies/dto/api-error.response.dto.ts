import { ApiProperty } from '@nestjs/swagger';

/**
 * Subconjunto do formato **global** de erro da API (inclui `requestId` em runtime).
 * O campo `message` pode ser string ou array (validação).
 */
export class ApiValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    description:
      'Mensagem única ou, em erros de validação múltipla, lista de mensagens.',
    example: 'title must be longer than or equal to 1 characters',
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Igual ao header `X-Request-Id` ecoado na resposta.',
    example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  })
  requestId!: string;

  @ApiProperty({ example: '/api/v1/movies' })
  path!: string;

  @ApiProperty({ format: 'date-time', example: '2026-04-30T12:00:00.000Z' })
  timestamp!: string;
}
