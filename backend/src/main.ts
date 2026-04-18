import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);
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

  const config = new DocumentBuilder()
    .setTitle('RejectCheck API')
    .setDescription('The RejectCheck application analysis API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const cleanedDocument = cleanupOpenApiDoc(document);
  SwaggerModule.setup('docs', app, cleanedDocument);

  await app.listen(process.env.PORT ?? 8888);
}
bootstrap();
