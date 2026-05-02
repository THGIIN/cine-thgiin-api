import { ApiProperty } from '@nestjs/swagger';

/** Corpo de `GET /api/v1/health` — verificação de disponibilidade do serviço. */
export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Estado liveness; `ok` indica processo HTTP ativo.',
  })
  status!: string;

  @ApiProperty({
    example: 'Cine Thgiin',
    description: 'Nome lógico da API (identificação em load balancers / logs).',
  })
  service!: string;
}
