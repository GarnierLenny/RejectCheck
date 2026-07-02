// Sentry must be imported BEFORE any other instrumentation. The init below
// is no-op when SENTRY_DSN is not set, so it's safe to keep at the top.
import './sentry.init';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProd = nodeEnv === 'production';

  // Behind Railway's edge proxy: trust the first hop so `req.ip` resolves to the
  // real client (rightmost untrusted XFF entry) instead of the proxy address.
  // Without this, the ThrottlerGuard buckets every client under the proxy IP and
  // the anonymous-quota IP is read from a client-forgeable header.
  app.set('trust proxy', 1);

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
void bootstrap();
