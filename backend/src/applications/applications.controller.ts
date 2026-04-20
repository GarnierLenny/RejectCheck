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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationSchema, UpdateApplicationSchema } from './dto/application.dto';
import { SupabaseGuard } from '../auth/supabase.guard';
import { AuthEmail } from '../auth/auth-email.decorator';
import { StripeService } from '../stripe/stripe.service';

@ApiTags('Applications')
@UseGuards(SupabaseGuard)
@Controller('api/applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly stripeService: StripeService,
  ) {}

  private async requirePremium(email: string) {
    const isPremium = await this.stripeService.checkSubscription(email);
    if (!isPremium) throw new ForbiddenException('Premium subscription required');
  }

  @Get()
  @ApiOperation({ summary: 'List all applications for the current user' })
  async list(@AuthEmail() email: string) {
    await this.requirePremium(email);
    return this.applicationsService.list(email);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  async create(@AuthEmail() email: string, @Body() body: unknown) {
    await this.requirePremium(email);
    const parsed = CreateApplicationSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);
    return this.applicationsService.create(email, parsed.data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application' })
  async update(
    @AuthEmail() email: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    await this.requirePremium(email);
    const parsed = UpdateApplicationSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);
    return this.applicationsService.update(email, id, parsed.data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an application' })
  async remove(@AuthEmail() email: string, @Param('id', ParseIntPipe) id: number) {
    await this.requirePremium(email);
    return this.applicationsService.remove(email, id);
  }
}
