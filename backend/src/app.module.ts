import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyzeModule } from './analyze/analyze.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: ['.env', '.env.local']
    }), 
    AnalyzeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
