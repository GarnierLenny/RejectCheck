import {
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { UnsubscribeService } from './application/unsubscribe.service';

/**
 * One-click unsubscribe (RFC 8058). The List-Unsubscribe header on marketing
 * emails POSTs here; the visible footer link GETs here. Both add the address to
 * the suppression list (reason=unsubscribe → marketing blocked, transactional
 * still delivered).
 */
@Controller('api/email/unsubscribe')
export class UnsubscribeController {
  constructor(private readonly unsubscribe: UnsubscribeService) {}

  // RFC 8058 one-click: mail clients POST here with no useful body.
  @Post()
  @HttpCode(200)
  async oneClick(@Query('token') token?: string): Promise<{ ok: boolean }> {
    const email = token ? this.unsubscribe.verify(token) : null;
    if (email) await this.unsubscribe.suppress(email, 'unsubscribe');
    return { ok: !!email };
  }

  // Visible footer link → confirmation page.
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async page(@Query('token') token?: string): Promise<string> {
    const email = token ? this.unsubscribe.verify(token) : null;
    if (email) await this.unsubscribe.suppress(email, 'unsubscribe');
    return email ? okPage(email) : errorPage();
  }
}

function shell(body: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RejectCheck</title></head>
<body style="margin:0;background:#F4F4F5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181B;">
<div style="max-width:480px;margin:0 auto;padding:80px 24px;text-align:center;">
  <div style="font-family:monospace;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#C0392B;margin-bottom:20px;">RejectCheck</div>
  ${body}
</div></body></html>`;
}

function okPage(email: string): string {
  return shell(`
    <h1 style="font-size:22px;font-weight:600;margin:0 0 12px;">Tu es désinscrit·e.</h1>
    <p style="font-size:15px;line-height:1.6;color:#52525B;margin:0;">
      <b style="color:#18181B;">${email}</b> ne recevra plus d'emails marketing de RejectCheck.
      Tu continueras à recevoir les emails essentiels liés à ton compte.
    </p>`);
}

function errorPage(): string {
  return shell(`
    <h1 style="font-size:22px;font-weight:600;margin:0 0 12px;">Lien invalide.</h1>
    <p style="font-size:15px;line-height:1.6;color:#52525B;margin:0;">
      Ce lien de désinscription est invalide ou a expiré. Écris-nous à
      <a href="mailto:support@rejectcheck.com" style="color:#C0392B;">support@rejectcheck.com</a>.
    </p>`);
}
