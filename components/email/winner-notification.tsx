/**
 * Winner notification email template.
 *
 * Used as a reference / documentation component. The actual HTML is also
 * inlined in winnerNotificationHtml() within actions/admin.ts for runtime
 * sending via Resend without a React Email build step.
 *
 * Preview this component with:
 *   npx react-email dev --dir src/components/email
 */

interface WinnerNotificationEmailProps {
  userName: string;
  competitionTitle: string;
  competitionSlug: string;
  claimDeadline: string;
  siteUrl?: string;
}

export function WinnerNotificationEmail({
  userName = "Sarah",
  competitionTitle = "Apple MacBook Pro M4 — 16-inch",
  competitionSlug = "macbook-pro-m4",
  claimDeadline = "2026-06-14",
  siteUrl = "https://goldendreandraw.com",
}: WinnerNotificationEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <style>{`
          body { font-family: Georgia, serif; background: #F8F5F0; color: #1A1A1A; margin: 0; padding: 0; }
          .email { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 16px; border: 1px solid #E5DFD5; padding: 40px; }
          .trophy { text-align: center; font-size: 48px; margin-bottom: 16px; }
          h1 { font-family: Georgia, serif; font-size: 24px; text-align: center; color: #1A1A1A; margin: 0 0 8px; }
          .prize { background: #FDF4E3; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
          .prize-name { font-size: 20px; font-weight: 700; color: #C6942E; }
          .deadline { background: #FFF3E0; border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center; font-size: 13px; color: #8B6914; }
          .cta { display: block; text-align: center; background: #C6942E; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; margin: 24px 0 8px; }
          .footer { font-size: 12px; color: #9B968B; text-align: center; margin-top: 28px; }
        `}</style>
      </head>
      <body>
        <div className="email">
          <div className="trophy">🏆</div>
          <h1>Congratulations, {userName}!</h1>
          <p style={{ textAlign: "center", color: "#6B6460" }}>
            You are the lucky winner of:
          </p>
          <div className="prize">
            <div className="prize-name">{competitionTitle}</div>
          </div>
          <div className="deadline">
            ⏰ You have <strong>14 days</strong> to claim your prize.
            <br />
            Claim deadline: <strong>{claimDeadline}</strong>
          </div>
          <p style={{ textAlign: "center", color: "#6B6460", fontSize: "14px" }}>
            To claim your prize, sign in to your account:
          </p>
          <a href={`${siteUrl}/en/competitions/${competitionSlug}`} className="cta">
            Claim Your Prize →
          </a>
          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#9B968B",
            }}
          >
            If you do not claim within 14 days, a new winner will be drawn.
          </p>
          <div className="footer">
            Golden Dream Draw — Skill-based prize competitions
            <br />© {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </body>
    </html>
  );
}
