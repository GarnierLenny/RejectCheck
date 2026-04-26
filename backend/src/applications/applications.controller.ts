import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
} from './dto/application.dto';
import { AuthEmail } from '../auth/auth-email.decorator';
import { RequiresPremium } from '../stripe/decorators/requires-premium.decorator';

import { ListApplicationsUseCase } from './application/list-applications.use-case';
import { CreateApplicationUseCase } from './application/create-application.use-case';
import { UpdateApplicationUseCase } from './application/update-application.use-case';
import { DeleteApplicationUseCase } from './application/delete-application.use-case';

@ApiTags('Applications')
@RequiresPremium()
@Controller('api/applications')
export class ApplicationsController {
  constructor(
    private readonly listUc: ListApplicationsUseCase,
    private readonly createUc: CreateApplicationUseCase,
    private readonly updateUc: UpdateApplicationUseCase,
    private readonly deleteUc: DeleteApplicationUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all applications for the current user' })
  list(@AuthEmail() email: string) {
    return this.listUc.execute(email);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  create(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = CreateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.createUc.execute(email, parsed.data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application' })
  update(
    @AuthEmail() email: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const parsed = UpdateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues[0].message);
    }
    return this.updateUc.execute(email, id, parsed.data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an application' })
  async remove(
    @AuthEmail() email: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.deleteUc.execute(email, id);
    return { ok: true };
  }
}
