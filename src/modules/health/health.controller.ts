import { Controller, Get } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@ApiProduces('application/json')
@ApiExtraModels(HealthResponseDto)
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Endpoint de **liveness**: confirma que o processo HTTP está ativo. Ideal para orquestradores (Kubernetes, Docker healthcheck). Não consulta banco de dados.',
  })
  @ApiOkResponse({
    description: '**200** — Serviço ativo.',
    type: HealthResponseDto,
  })
  getHealth(): HealthResponseDto {
    return { status: 'ok', service: 'Cine Thgiin' };
  }
}
