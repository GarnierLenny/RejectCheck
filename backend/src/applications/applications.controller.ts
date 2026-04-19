import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';

@Controller('api/applications')
@UseGuards(SupabaseGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(@AuthEmail() email: string) {
    return this.applicationsService.list(email);
  }

  @Post()
  create(@AuthEmail() email: string, @Body() body: {
    jobTitle: string;
    company: string;
    status?: string;
    appliedAt?: string;
    notes?: string;
    analysisId?: number;
  }) {
    return this.applicationsService.create(email, body);
  }

  @Patch(':id')
  update(
    @AuthEmail() email: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      jobTitle?: string;
      company?: string;
      status?: string;
      appliedAt?: string;
      notes?: string;
      analysisId?: number;
    },
  ) {
    return this.applicationsService.update(email, id, body);
  }

  @Delete(':id')
  remove(@AuthEmail() email: string, @Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.remove(email, id);
  }
}
