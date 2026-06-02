/* ═══════════════════════════════════════════════════════════
   Branded Email Templates — Golden Dream Draw
   ═══════════════════════════════════════════════════════════
   Design tokens matching globals.css:
     Cream:  #FDFBF7
     Cream-warm: #F8F3E9
     Gold:   #B8943A
     Gold-light: #D4B96A
     Gold-pale: #F0E6CC
     Gold-dark: #8B6914
     Ink:   #1C1C1C
     Ink-soft: #4A4A4A
     Ink-muted: #7A7A7A
     Border: #E5DED2
     Border-light: #F0EAE0
     Success: #2D7D56
     Urgent: #C0392B
   Font: Georgia / serif (Playfair substitute for email-safe)
*/

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://goldendreandraw.com";

/* ── Shared wrapper ───────────────────────────────────── */

function baseWrapper(bodyHtml: string, previewText?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${previewText ? `<meta name="x-apple-disable-message-reformatting">` : ""}
  ${previewText ? `<!--[if !mso]><!--><meta name="color-scheme" content="light"><!--<![endif]-->` : ""}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #FDFBF7;
      color: #1C1C1C;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .wrapper { background: #FDFBF7; padding: 32px 16px; }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E5DED2;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #F8F3E9 0%, #F0E6CC 100%);
      padding: 32px 40px 24px;
      text-align: center;
      border-bottom: 1px solid #E5DED2;
    }
    .header h1 {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: 700;
      color: #1C1C1C;
      margin: 0;
    }
    .header .subtitle {
      font-size: 13px;
      color: #8B6914;
      margin-top: 6px;
      letter-spacing: 0.5px;
    }
    .body { padding: 32px 40px; }
    .body p {
      font-size: 15px;
      line-height: 1.6;
      color: #4A4A4A;
      margin-bottom: 16px;
    }
    .body p:last-child { margin-bottom: 0; }
    .highlight-box {
      background: #F0E6CC;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 20px 0;
      text-align: center;
    }
    .highlight-box .big-number {
      font-size: 36px;
      font-weight: 700;
      color: #8B6914;
      letter-spacing: 6px;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .highlight-box .label {
      font-size: 13px;
      color: #8B6914;
      margin-top: 4px;
    }
    .cta-box { text-align: center; margin: 24px 0; }
    .cta {
      display: inline-block;
      background: #B8943A;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 24px;
      font-size: 15px;
      font-weight: 600;
      font-family: Georgia, 'Times New Roman', serif;
      text-align: center;
    }
    .cta:hover { background: #8B6914; }
    .info-row {
      border-top: 1px solid #F0EAE0;
      padding: 16px 0;
      display: flex;
      justify-content: space-between;
    }
    .info-row .label { font-size: 12px; color: #7A7A7A; text-transform: uppercase; letter-spacing: 1px; }
    .info-row .value { font-size: 15px; font-weight: 600; color: #1C1C1C; }
    .divider {
      height: 1px;
      background: #F0EAE0;
      margin: 24px 0;
    }
    .card {
      border: 1px solid #E5DED2;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 20px 0;
      background: #FDFBF7;
    }
    .card .title {
      font-size: 13px;
      color: #7A7A7A;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .card .value {
      font-size: 16px;
      font-weight: 700;
      color: #B8943A;
    }
    .prize-card {
      background: #F8F3E9;
      border: 1px solid #E5DED2;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 20px 0;
      text-align: center;
    }
    .prize-card .emoji { font-size: 32px; margin-bottom: 8px; }
    .prize-card .name {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 18px;
      font-weight: 700;
      color: #8B6914;
    }
    .prize-card .detail { font-size: 13px; color: #7A7A7A; margin-top: 4px; }
    .urgent-box {
      background: #FFF3E0;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      text-align: center;
      font-size: 13px;
      color: #8B6914;
      border: 1px solid #F0E6CC;
    }
    .footer {
      border-top: 1px solid #E5DED2;
      padding: 20px 40px 28px;
      text-align: center;
      background: #FDFBF7;
    }
    .footer p {
      font-size: 11px;
      color: #7A7A7A;
      line-height: 1.6;
      margin-bottom: 4px;
    }
    .footer a { color: #B8943A; text-decoration: underline; }
    @media only screen and (max-width: 480px) {
      .wrapper { padding: 16px 8px; }
      .header, .body, .footer { padding-left: 24px; padding-right: 24px; }
    }
  </style>
</head>
<body>
  ${previewText ? `<!--[if !mso]><!--><div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</div><!--<![endif]-->` : ""}
  <div class="wrapper">
    <div class="container">
      ${bodyHtml}
    </div>
    <div style="text-align:center;padding:16px 0 0;font-size:11px;color:#7A7A7A;font-family:Georgia,serif;">
      Golden Dream Draw &mdash; Skill-based prize competitions
    </div>
  </div>
</body>
</html>`;
}

/* ── 1. Login Code ────────────────────────────────────── */

export function loginCodeEmailHtml(code: string): string {
  const body = `
    <div class="header">
      <h1 style="color: #1C1C1C;">Sign in to Golden Dream Draw</h1>
      <div class="subtitle" style="color: #8B6914;">Your one-time login code</div>
    </div>
    <div class="body">
      <p>Use the code below to sign in to your account. This code expires in <strong>15 minutes</strong>.</p>

      <div class="highlight-box">
        <div class="big-number">${code}</div>
        <div class="label">Enter this 6-digit code on the login page</div>
      </div>

      <div class="urgent-box">
        ⚠️ Never share this code with anyone. Our team will never ask for it.
      </div>

      <p style="font-size:13px;color:#7A7A7A;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>Golden Dream Draw Ltd</p>
      <p>Skill-based prize competitions &bull; UK registered</p>
    </div>
  `;
  return baseWrapper(body, "Your login code is ${code}");
}

/* ── 2. Purchase Confirmation ─────────────────────────── */

export function purchaseConfirmationHtml(params: {
  userName: string;
  ticketNumbers: number[];
  competitionTitle: string;
  competitionSlug: string;
  drawDate: string;
  totalPaid: string;
}): string {
  const body = `
    <div class="header">
      <h1>🎟️ Tickets Confirmed!</h1>
      <div class="subtitle">Your entry has been received</div>
    </div>
    <div class="body">
      <p>Thanks, ${params.userName}! Your tickets for <strong>${params.competitionTitle}</strong> are confirmed.</p>

      <div class="prize-card">
        <div class="emoji">🏆</div>
        <div class="name">${params.competitionTitle}</div>
        <div class="detail">${params.ticketNumbers.length} ticket(s) &bull; £${params.totalPaid}</div>
      </div>

      <div class="card">
        <div class="title">Your Ticket Numbers</div>
        <div style="font-size:20px;font-weight:700;color:#8B6914;font-family:Georgia,serif;letter-spacing:2px;margin-top:4px;">
          ${params.ticketNumbers.map((n) => `#${n}`).join("  ")}
        </div>
      </div>

      <div class="divider"></div>

      <div class="info-row">
        <span class="label">Draw Date</span>
        <span class="value">${params.drawDate}</span>
      </div>
      <div class="info-row">
        <span class="label">Total Paid</span>
        <span class="value">£${params.totalPaid}</span>
      </div>

      <div class="cta-box">
        <a href="${SITE_URL}/en/competitions/${params.competitionSlug}" class="cta">View Competition →</a>
      </div>

      <p style="font-size:13px;color:#7A7A7A;text-align:center;">
        Watch the live draw on our YouTube channel. Good luck! 🍀
      </p>
    </div>
    <div class="footer">
      <p>Golden Dream Draw Ltd</p>
      <p>Skill-based prize competitions &bull; UK registered</p>
    </div>
  `;
  return baseWrapper(body, "Your tickets are confirmed!");
}

/* ── 3. Winner Notification ──────────────────────────── */

export function winnerNotificationHtml(params: {
  userName: string;
  competitionTitle: string;
  competitionSlug: string;
  claimDeadline: string;
}): string {
  const body = `
    <div class="header">
      <h1>🏆 Congratulations!</h1>
      <div class="subtitle">You are a winner!</div>
    </div>
    <div class="body">
      <p>${params.userName}, we have incredible news — you've won the <strong>${params.competitionTitle}</strong> competition!</p>

      <div class="prize-card">
        <div class="emoji">🎁</div>
        <div class="name">${params.competitionTitle}</div>
        <div class="detail">Your prize is waiting to be claimed</div>
      </div>

      <div class="urgent-box">
        ⏰ You have <strong>14 days</strong> to claim your prize.<br>
        <strong>Claim deadline: ${params.claimDeadline}</strong>
      </div>

      <p>To claim your prize, sign in to your account and follow the instructions.</p>

      <div class="cta-box">
        <a href="${SITE_URL}/en/competitions/${params.competitionSlug}" class="cta">Claim Your Prize →</a>
      </div>

      <p style="font-size:13px;color:#7A7A7A;text-align:center;">
        If you do not claim within 14 days, a new winner will be drawn.
      </p>
    </div>
    <div class="footer">
      <p>Golden Dream Draw Ltd</p>
      <p>Skill-based prize competitions &bull; UK registered</p>
      <p style="margin-top:8px;">
        <a href="${SITE_URL}/en/competitions/${params.competitionSlug}">View competition details</a>
      </p>
    </div>
  `;
  return baseWrapper(body, "Congratulations! You've won!");
}

/* ── 4. Redraw Notice ─────────────────────────────────── */

export function redrawNoticeHtml(params: {
  userName: string;
  competitionTitle: string;
  competitionSlug: string;
}): string {
  const body = `
    <div class="header">
      <h1>Redraw Notice</h1>
      <div class="subtitle">A new winner will be drawn</div>
    </div>
    <div class="body">
      <p>Hi ${params.userName},</p>
      <p>The previous winner for <strong>${params.competitionTitle}</strong> did not claim their prize within the 14-day window. A new winner is being drawn.</p>

      <div class="card" style="text-align:center;">
        <div class="title">Competition</div>
        <div class="value">${params.competitionTitle}</div>
      </div>

      <p>No action is needed from you. The new winner will be announced shortly.</p>

      <div class="cta-box">
        <a href="${SITE_URL}/en/competitions/${params.competitionSlug}" class="cta">View Competition →</a>
      </div>
    </div>
    <div class="footer">
      <p>Golden Dream Draw Ltd</p>
      <p>Skill-based prize competitions &bull; UK registered</p>
    </div>
  `;
  return baseWrapper(body, "Redraw notice for ${params.competitionTitle}");
}
