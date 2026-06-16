import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  emailCategoryOf,
  type EmailJobPayload,
  type EmailLocale,
  type EmailMessage,
} from '../domain/email.types';

/**
 * Renders a typed email payload into a ready-to-send EmailMessage, FR/EN.
 *
 * The HTML is table-based + fully inline-styled (Outlook / Gmail / Apple Mail
 * safe), 600px wide, ported from the RejectCheck design-system email handoff
 * ("Emails RejectCheck.html"). Header + footer are shared across every email
 * type, only the body changes, exactly as the design intends. Palette is the
 * design's own (#C0392B red, #18181B ink, #F4F4F5 page).
 */
@Injectable()
export class EmailRenderer {
  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    // Emails need a PUBLIC origin for images + links (Gmail's proxy can't reach
    // localhost). EMAIL_BASE_URL overrides the dev FRONTEND_URL for this.
    return (
      this.config.get<string>('EMAIL_BASE_URL') ??
      this.config.get<string>('FRONTEND_URL') ??
      'https://rejectcheck.com'
    );
  }

  render(payload: EmailJobPayload): EmailMessage {
    const { context, locale, to } = payload;
    const s = STRINGS[locale];
    const base = this.baseUrl;

    let eyebrow: string;
    let heading: string;
    let body: string;
    let ctaLabel: string;
    let ctaUrl: string;
    let subNote: string;

    switch (context.type) {
      case 'welcome':
        eyebrow = s.welcome.eyebrow;
        heading = s.welcome.heading(context.firstName);
        body = s.welcome.body;
        ctaLabel = s.welcome.cta;
        ctaUrl = `${base}/${locale}/analyze`;
        subNote = s.welcome.subNote;
        break;
      case 'analysis_ready':
        eyebrow = s.analysisReady.eyebrow;
        heading = s.analysisReady.heading;
        body = s.analysisReady.body(context.role);
        ctaLabel = s.analysisReady.cta;
        ctaUrl = `${base}/${locale}/dashboard`;
        subNote = s.analysisReady.subNote;
        break;
      case 'drip_d1':
        eyebrow = s.dripD1.eyebrow;
        heading = s.dripD1.heading;
        body = s.dripD1.body;
        ctaLabel = s.dripD1.cta;
        ctaUrl = `${base}/${locale}/analyze`;
        subNote = s.dripD1.subNote;
        break;
      case 'drip_d3':
        eyebrow = s.dripD3.eyebrow;
        heading = s.dripD3.heading;
        body = s.dripD3.body;
        ctaLabel = s.dripD3.cta;
        ctaUrl = `${base}/${locale}/analyze`;
        subNote = s.dripD3.subNote;
        break;
    }

    const subject = SUBJECTS[locale][context.type];
    const html = wrapEmail({ base, locale, s, eyebrow, heading, body, ctaLabel, ctaUrl, subNote });
    const text = `${heading}\n\n${stripTags(body)}\n\n${ctaLabel}: ${ctaUrl}`;

    return {
      to,
      subject,
      html,
      text,
      category: emailCategoryOf(context.type),
      type: context.type,
      locale,
    };
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ── Email shell (header + body + footer), ported from the design handoff ─────

function wrapEmail(p: {
  base: string;
  locale: EmailLocale;
  s: Strings;
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  subNote: string;
}): string {
  const logo = `${p.base}/email/logo-mark.png`;
  const f = p.s.footer;
  const support = 'mailto:support@rejectcheck.com';
  const faq = `${p.base}/${p.locale}/pricing`;
  // Interim: points at account settings until the dedicated one-click
  // unsubscribe + preferences routes ship (P4, with List-Unsubscribe headers).
  const prefs = `${p.base}/${p.locale}/settings`;
  const linkedin = 'https://www.linkedin.com/company/rejectcheck';
  const github = 'https://github.com/GarnierLenny/RejectCheck';
  const instagram = 'https://www.instagram.com/rejectcheck_';

  // Real white social icons (hosted PNGs, Outlook-safe, unlike SVG/CSS pills).
  const icon = (href: string, file: string, alt: string, last = false) =>
    `<td style="${last ? '' : 'padding-right:16px;'}"><a href="${href}" style="text-decoration:none;"><img src="${p.base}/email/${file}" width="24" height="24" alt="${alt}" style="display:block;width:24px;height:24px;border:0;"></a></td>`;
  const social = `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;"><tr>
              ${icon(linkedin, 'icon-linkedin.png', 'LinkedIn')}
              ${icon(github, 'icon-github.png', 'GitHub')}
              ${icon(instagram, 'icon-instagram.png', 'Instagram', true)}
            </tr></table>`;

  return `<!doctype html>
<html lang="${p.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F4F4F5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${stripTags(p.body).slice(0, 110)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F4F5;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;border:1px solid #E2E2E4;border-radius:12px;overflow:hidden;">

      <!-- HEADER -->
      <tr><td style="padding:22px 32px;border-bottom:1px solid #E2E2E4;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right:11px;vertical-align:middle;"><img src="${logo}" width="30" height="30" alt="RejectCheck" style="display:block;width:30px;height:30px;border:0;"></td>
          <td style="vertical-align:middle;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;letter-spacing:-0.01em;color:#18181B;">RejectCheck</td>
        </tr></table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:38px 40px 8px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#A1A1AA;">${p.eyebrow}</div>
        <h1 style="margin:14px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:27px;line-height:1.22;font-weight:600;letter-spacing:-0.015em;color:#18181B;">${p.heading}</h1>
        <p style="margin:16px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.62;color:#52525B;">${p.body}</p>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:24px 40px 6px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td align="center" bgcolor="#C0392B" style="border-radius:8px;background:#C0392B;">
            <a href="${p.ctaUrl}" style="display:inline-block;padding:14px 30px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:0.01em;">${p.ctaLabel}&nbsp;&rarr;</a>
          </td>
        </tr></table>
        <p style="margin:16px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#A1A1AA;">${p.subNote}</p>
      </td></tr>

      <!-- FOOTER (inverted: RejectCheck red band, white text + icons) -->
      <tr><td style="padding:32px 40px 36px;background:#C0392B;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;"><tr>
          <td style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.04em;white-space:nowrap;"><a href="${support}" style="color:#FFFFFF;text-decoration:none;">${f.help}</a></td>
          <td style="padding:0 10px;color:rgba(255,255,255,0.4);font-family:'JetBrains Mono',monospace;font-size:11px;">&middot;</td>
          <td style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.04em;"><a href="${support}" style="color:#FFFFFF;text-decoration:none;">${f.support}</a></td>
          <td style="padding:0 10px;color:rgba(255,255,255,0.4);font-family:'JetBrains Mono',monospace;font-size:11px;">&middot;</td>
          <td style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.04em;"><a href="${faq}" style="color:#FFFFFF;text-decoration:none;">${f.faq}</a></td>
        </tr></table>
${social}
        <p style="margin:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.72);">
          ${f.legal}<br>
          <a href="${prefs}" style="color:#FFFFFF;text-decoration:underline;">${f.unsubscribe}</a> &middot; <a href="${prefs}" style="color:#FFFFFF;text-decoration:underline;">${f.preferences}</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

// ── Copy (FR/EN) ─────────────────────────────────────────────────────────────

type BodyCopy = { eyebrow: string; heading: string; body: string; cta: string; subNote: string };
type Strings = {
  welcome: Omit<BodyCopy, 'heading'> & { heading: (n?: string | null) => string };
  analysisReady: Omit<BodyCopy, 'body'> & { body: (role?: string | null) => string };
  dripD1: BodyCopy;
  dripD3: BodyCopy;
  footer: {
    help: string;
    support: string;
    faq: string;
    legal: string;
    unsubscribe: string;
    preferences: string;
  };
};

const SUBJECTS: Record<EmailLocale, Record<EmailJobPayload['context']['type'], string>> = {
  fr: {
    welcome: 'Bienvenue sur RejectCheck',
    analysis_ready: 'Ton analyse approfondie est prête',
    drip_d1: 'Comment réduire ton risque de rejet',
    drip_d3: 'Un dernier conseil avant ta prochaine candidature',
  },
  en: {
    welcome: 'Welcome to RejectCheck',
    analysis_ready: 'Your deep analysis is ready',
    drip_d1: 'How to lower your rejection risk',
    drip_d3: 'One last tip before your next application',
  },
};

const STRINGS: Record<EmailLocale, Strings> = {
  fr: {
    welcome: {
      eyebrow: 'Bienvenue',
      heading: (n) => (n ? `Bienvenue, ${n}.` : 'Bienvenue sur RejectCheck.'),
      body: 'Ton compte est prêt. Tu as <b style="color:#18181B;font-weight:600;">3 analyses complètes par mois</b>, chaque rapport sauvegardé, avec ton risque de rejet et les raisons exactes. Lance ta première dès maintenant.',
      cta: 'Analyser mon CV',
      subNote: 'Aucune carte requise · résultat en ~30 secondes.',
    },
    analysisReady: {
      eyebrow: 'Analyse terminée',
      heading: 'Ton analyse est prête.',
      body: (role) =>
        `Ton analyse approfondie${role ? ` pour <b style="color:#18181B;font-weight:600;">${role}</b>` : ''} vient de se terminer. Retrouve le verdict, le détail et la roadmap dans ton espace.`,
      cta: 'Voir mon rapport complet',
      subNote: 'Ton analyse reste disponible 30 jours dans ton espace.',
    },
    dripD1: {
      eyebrow: 'Conseil',
      heading: 'Tu as vu ton risque. Voici comment le baisser.',
      body: 'La plupart des CV sont rejetés pour 2-3 raisons récurrentes : pas de chiffres d’impact, trous non expliqués, stack qui ne matche pas l’offre. Relance une analyse après tes corrections pour voir le score bouger.',
      cta: 'Relancer une analyse',
      subNote: '3 quick wins suffisent souvent à passer en risque faible.',
    },
    dripD3: {
      eyebrow: 'Avant de postuler',
      heading: 'Adapte ton CV à chaque offre.',
      body: 'Adapter ton CV à l’offre fait souvent plus de différence que le contenu lui-même. Colle l’offre dans RejectCheck pour voir le match et les écarts, offre par offre.',
      cta: 'Analyser une offre',
      subNote: 'Ça prend ~30 secondes par offre.',
    },
    footer: {
      help: 'Centre d’aide',
      support: 'Support',
      faq: 'FAQ',
      legal: 'Tu reçois cet email parce que tu as un compte RejectCheck.',
      unsubscribe: 'Se désinscrire',
      preferences: 'Préférences email',
    },
  },
  en: {
    welcome: {
      eyebrow: 'Welcome',
      heading: (n) => (n ? `Welcome, ${n}.` : 'Welcome to RejectCheck.'),
      body: 'Your account is ready. You get <b style="color:#18181B;font-weight:600;">3 full analyses per month</b>, every report saved, with your rejection risk and the exact reasons. Run your first one now.',
      cta: 'Analyze my CV',
      subNote: 'No card required · results in ~30 seconds.',
    },
    analysisReady: {
      eyebrow: 'Analysis complete',
      heading: 'Your analysis is ready.',
      body: (role) =>
        `Your deep analysis${role ? ` for <b style="color:#18181B;font-weight:600;">${role}</b>` : ''} just finished. Find the verdict, the breakdown and the roadmap in your dashboard.`,
      cta: 'View my full report',
      subNote: 'Your analysis stays available for 30 days in your account.',
    },
    dripD1: {
      eyebrow: 'Tip',
      heading: 'You saw your risk. Here’s how to lower it.',
      body: 'Most CVs get rejected for 2-3 recurring reasons: no impact numbers, unexplained gaps, a stack that doesn’t match the role. Re-run an analysis after your edits to watch the score move.',
      cta: 'Re-run an analysis',
      subNote: '3 quick wins are often enough to drop to low risk.',
    },
    dripD3: {
      eyebrow: 'Before you apply',
      heading: 'Tailor your CV to each role.',
      body: 'Tailoring your CV to the role often matters more than the content itself. Paste the job post into RejectCheck to see the match and the gaps, role by role.',
      cta: 'Analyze a job post',
      subNote: 'It takes ~30 seconds per role.',
    },
    footer: {
      help: 'Help center',
      support: 'Support',
      faq: 'FAQ',
      legal: 'You receive this email because you have a RejectCheck account.',
      unsubscribe: 'Unsubscribe',
      preferences: 'Email preferences',
    },
  },
};
