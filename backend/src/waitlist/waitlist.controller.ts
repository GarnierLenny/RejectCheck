import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { z } from 'zod';

const WaitlistSchema = z.object({ email: z.email() });

@ApiTags('Waitlist')
@Controller('api/waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  async join(@Body() body: unknown, @Res() res: any) {
    const parsed = WaitlistSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid email' });
    try {
      await this.waitlistService.addEmail(parsed.data.email);
      return res.status(201).json({ message: 'Added to waitlist' });
    } catch (err: any) {
      if (err.status === 409) return res.status(409).json({ message: err.message });
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
