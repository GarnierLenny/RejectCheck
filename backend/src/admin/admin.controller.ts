import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('api/admin')
export class AdminController {
  constructor(private configService: ConfigService) {}

  @Post('verify')
  verifyKey(@Body('key') key: string) {
    const adminKey = this.configService.get<string>('ADMIN_SECRET_KEY');
    if (key !== adminKey) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return { success: true };
  }
}
