import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { SavedCvRepository } from '../ports/saved-cv.repository';
import type { SavedCv } from '../domain/analysis.types';

@Injectable()
export class PrismaSavedCvRepository implements SavedCvRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByEmail(email: string): Promise<SavedCv[]> {
    return this.prisma.savedCv.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  add(email: string, name: string, url: string): Promise<SavedCv> {
    return this.prisma.savedCv.create({ data: { email, name, url } });
  }

  async removeOwned(email: string, id: number): Promise<void> {
    const cv = await this.prisma.savedCv.findFirst({
      where: { id, email },
      select: { id: true },
    });
    if (!cv) throw new NotFoundException('Saved CV not found');
    await this.prisma.savedCv.delete({ where: { id } });
  }
}
