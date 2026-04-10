import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaitlistService {
  constructor(private prisma: PrismaService) {}

  async addEmail(email: string): Promise<void> {
    try {
      await this.prisma.waitlist.create({ data: { email } });
    } catch (err: any) {
      if (err.code === 'P2002') throw new ConflictException('Email already registered');
      throw err;
    }
  }
}
