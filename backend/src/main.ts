// Sentry must be imported BEFORE any other instrumentation. The init below
// is no-op when SENTRY_DSN is not set, so it's safe to keep at the top.
import './sentry.init';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProd = nodeEnv === 'production';

  app.use(helmet());

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const corsOriginEnv =
    configService.get<string>('CORS_ORIGIN') ||
    'https://rejectcheck.com,https://www.rejectcheck.com,http://localhost:3000';
  const corsOrigins = corsOriginEnv
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    credentials: true,
  });

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('RejectCheck API')
      .setDescription('The RejectCheck application analysis API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const cleanedDocument = cleanupOpenApiDoc(document);
    SwaggerModule.setup('docs', app, cleanedDocument);
  }

  await app.listen(process.env.PORT ?? 8888);
}
bootstrap();
