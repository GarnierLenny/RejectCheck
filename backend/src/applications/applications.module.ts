import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';

import { APPLICATION_REPOSITORY } from './ports/tokens';
import { PrismaApplicationRepository } from './infrastructure/prisma-application.repository';

import { ListApplicationsUseCase } from './application/list-applications.use-case';
import { CreateApplicationUseCase } from './application/create-application.use-case';
import { UpdateApplicationUseCase } from './application/update-application.use-case';
import { DeleteApplicationUseCase } from './application/delete-application.use-case';

@Module({
  imports: [PrismaModule, StripeModule],
  controllers: [ApplicationsController],
  providers: [
    { provide: APPLICATION_REPOSITORY, useClass: PrismaApplicationRepository },
    ListApplicationsUseCase,
    CreateApplicationUseCase,
    UpdateApplicationUseCase,
    DeleteApplicationUseCase,
  ],
})
export class ApplicationsModule {}
