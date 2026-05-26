import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetSharedAnalysisUseCase } from './application/get-shared-analysis.use-case';

@ApiTags('Share')
@Controller('api/share')
export class ShareController {
  constructor(private readonly getSharedAnalysis: GetSharedAnalysisUseCase) {}

  @Get(':token')
  @ApiOperation({ summary: 'Fetch a publicly shared analysis by its token' })
  async getShared(@Param('token') token: string) {
    const result = await this.getSharedAnalysis.execute(token);
    if (!result) throw new NotFoundException('Shared analysis not found');
    return result;
  }
}
