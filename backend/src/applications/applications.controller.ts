import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationSchema, UpdateApplicationSchema } from './dto/application.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';

@ApiTags('Applications')
@UseGuards(SupabaseGuard)
@Controller('api/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all applications for the current user' })
  list(@AuthEmail() email: string) {
    return this.applicationsService.list(email);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  create(@AuthEmail() email: string, @Body() body: unknown) {
    const parsed = CreateApplicationSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);
    return this.applicationsService.create(email, parsed.data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application' })
  update(
    @AuthEmail() email: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const parsed = UpdateApplicationSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);
    return this.applicationsService.update(email, id, parsed.data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an application' })
  remove(@AuthEmail() email: string, @Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.remove(email, id);
  }
}
