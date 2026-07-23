import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailRenderer } from './infrastructure/email-renderer';
import { EnqueueEmailUseCase } from './application/enqueue-email.use-case';
import type {
  EmailContext,
  EmailJobPayload,
  EmailLocale,
  EmailType,
} from './domain/email.types';

const TYPES: EmailType[] = ['welcome', 'analysis_ready', 'drip_d1', 'drip_d3'];
const LOCALES: EmailLocale[] = ['fr', 'en'];

// Permissive CSP so the email's inline styles render in the browser preview
// (helmet's default CSP would otherwise strip them).
const PREVIEW_CSP = "default-src * data: blob: 'unsafe-inline'";

/**
 * Email playground: preview every template in the browser and send a test to
 * any address. Open in dev (NODE_ENV !== production), or in prod with
 * ?secret=<EMAIL_DEV_SECRET>. Returns 404 otherwise. Mounted at /api/email/dev.
 */
@Controller('api/email/dev')
export class EmailDevController {
  constructor(
    private readonly config: ConfigService,
    private readonly renderer: EmailRenderer,
    private readonly enqueue: EnqueueEmailUseCase,
  ) {}

  private assertAllowed(secret?: string): void {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    if (!isProd) return;
    const adminSecret = this.config.get<string>('EMAIL_DEV_SECRET');
    if (!adminSecret || secret !== adminSecret) throw new NotFoundException();
  }

  private sampleContext(type: EmailType): EmailContext {
    switch (type) {
      case 'welcome':
        return { type: 'welcome', firstName: 'Alex' };
      case 'analysis_ready':
        return {
          type: 'analysis_ready',
          analysisId: 123,
          role: 'Senior React Engineer',
        };
      case 'drip_d1':
        return { type: 'drip_d1' };
      case 'drip_d3':
        return { type: 'drip_d3' };
    }
  }

  private samplePayload(
    type: EmailType,
    locale: EmailLocale,
    to: string,
  ): EmailJobPayload {
    return { to, locale, context: this.sampleContext(type) };
  }

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Content-Security-Policy', PREVIEW_CSP)
  index(@Query('secret') secret?: string): string {
    this.assertAllowed(secret);
    const enabled = this.config.get<string>('EMAIL_ENABLED') === 'true';
    return indexHtml(enabled, secret ?? '');
  }

  @Get('preview')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Content-Security-Policy', PREVIEW_CSP)
  preview(
    @Query('type') type: EmailType,
    @Query('locale') locale: EmailLocale = 'en',
    @Query('secret') secret?: string,
  ): string {
    this.assertAllowed(secret);
    if (!TYPES.includes(type)) throw new NotFoundException('unknown type');
    return this.renderer.render(
      this.samplePayload(type, locale, 'preview@rejectcheck.com'),
    ).html;
  }

  @Get('send')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Content-Security-Policy', PREVIEW_CSP)
  async send(
    @Query('to') to: string,
    @Query('type') type: EmailType,
    @Query('locale') locale: EmailLocale = 'en',
    @Query('secret') secret?: string,
  ): Promise<string> {
    this.assertAllowed(secret);
    if (!to || !TYPES.includes(type)) {
      return resultHtml(
        { ok: false, msg: 'Missing or invalid email/type.' },
        secret,
      );
    }
    const enabled = this.config.get<string>('EMAIL_ENABLED') === 'true';
    try {
      await this.enqueue.execute({
        ...this.samplePayload(type, locale, to),
        // unique per click so test-sends are never deduped away
        dedupeKey: `dev:${type}:${to}:${process.hrtime.bigint().toString()}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return resultHtml(
        {
          ok: false,
          msg: `Enqueue FAILED: ${msg} — likely the DB is missing the EmailLog table (run "prisma db push" against this environment's DB).`,
        },
        secret,
      );
    }
    return resultHtml(
      {
        ok: true,
        msg: enabled
          ? `Sent "${type}" (${locale}) to ${to} via Resend. Check the inbox + Resend dashboard.`
          : `Enqueued "${type}" (${locale}) to ${to}, but EMAIL_ENABLED is not "true" → logged, NOT sent. Set EMAIL_ENABLED=true (+ verified domain) to deliver.`,
      },
      secret,
    );
  }
}

// ── tiny HTML helpers ────────────────────────────────────────────────────────

const q = (secret: string) =>
  secret ? `&secret=${encodeURIComponent(secret)}` : '';

function shell(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RejectCheck · Email dev</title></head>
<body style="margin:0;background:#1a1917;color:#f7f5f2;font-family:ui-monospace,Menlo,monospace;">
<div style="max-width:760px;margin:0 auto;padding:48px 24px;">${body}</div></body></html>`;
}

function indexHtml(enabled: boolean, secret: string): string {
  const rows = TYPES.map((type) => {
    const previews = LOCALES.map(
      (l) =>
        `<a href="/api/email/dev/preview?type=${type}&locale=${l}${q(secret)}" target="_blank" style="display:inline-block;margin-right:8px;padding:7px 12px;border:1px solid #d4cfc9;border-radius:8px;color:#f7f5f2;text-decoration:none;font-size:12px;">Preview ${l.toUpperCase()} ↗</a>`,
    ).join('');
    return `<tr><td style="padding:14px 0;border-bottom:1px solid rgba(247,245,242,.12);"><b style="color:#f7b0af;">${type}</b></td><td style="padding:14px 0;border-bottom:1px solid rgba(247,245,242,.12);text-align:right;">${previews}</td></tr>`;
  }).join('');

  const banner = enabled
    ? `<div style="background:rgba(34,163,80,.15);border:1px solid #22a350;color:#7be0a0;padding:12px 14px;border-radius:10px;font-size:12px;margin-bottom:28px;">EMAIL_ENABLED=true — test sends go out via Resend (needs a verified domain).</div>`
    : `<div style="background:rgba(201,58,57,.15);border:1px solid #C93A39;color:#f7b0af;padding:12px 14px;border-radius:10px;font-size:12px;margin-bottom:28px;">EMAIL_ENABLED is not "true" — test sends are LOGGED, not delivered. Previews work either way.</div>`;

  const options = TYPES.map((t) => `<option value="${t}">${t}</option>`).join(
    '',
  );

  return shell(`
    <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#C93A39;margin-bottom:10px;">RejectCheck · Email dev</div>
    <h1 style="font-size:24px;font-weight:600;margin:0 0 24px;">Preview & test emails</h1>
    ${banner}
    <table style="width:100%;border-collapse:collapse;margin-bottom:36px;">${rows}</table>
    <h2 style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#6b6860;margin:0 0 14px;">Send a test</h2>
    <form method="get" action="/api/email/dev/send" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
      <input type="hidden" name="secret" value="${secret}">
      <input name="to" type="email" placeholder="you@email.com" required style="flex:1;min-width:220px;padding:11px 13px;border:1px solid #d4cfc9;border-radius:8px;background:#262421;color:#f7f5f2;font-size:13px;">
      <select name="type" style="padding:11px 13px;border:1px solid #d4cfc9;border-radius:8px;background:#262421;color:#f7f5f2;font-size:13px;">${options}</select>
      <select name="locale" style="padding:11px 13px;border:1px solid #d4cfc9;border-radius:8px;background:#262421;color:#f7f5f2;font-size:13px;"><option value="fr">FR</option><option value="en">EN</option></select>
      <button type="submit" style="padding:11px 20px;border:none;border-radius:8px;background:#C93A39;color:#fff;font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;">Send →</button>
    </form>`);
}

function resultHtml(r: { ok: boolean; msg: string }, secret = ''): string {
  return shell(`
    <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#C93A39;margin-bottom:18px;">RejectCheck · Email dev</div>
    <div style="padding:16px 18px;border-radius:12px;border:1px solid ${r.ok ? '#22a350' : '#C93A39'};background:${r.ok ? 'rgba(34,163,80,.12)' : 'rgba(201,58,57,.12)'};font-size:13px;line-height:1.6;">${r.msg}</div>
    <a href="/api/email/dev?secret=${encodeURIComponent(secret)}" style="display:inline-block;margin-top:24px;color:#f7b0af;font-size:12px;">← Back</a>`);
}
