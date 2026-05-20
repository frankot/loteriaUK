import Image from "next/image";
import Link from "next/link";

const footerLinks = {
  Competitions: ["All Prizes", "Electronics", "Jewellery", "Fashion", "Cash Awards"],
  Company: ["About Us", "Our Winners", "Live Draws", "Contact", "Careers"],
  Support: ["FAQ", "Free Postal Entry", "Terms & Conditions", "Privacy Policy", "Responsible Play"],
};

const paymentMethods = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"];

export default function Footer() {
  return (
    <footer className="bg-cream-warm px-12 lg:mt-20 pt-20 pb-10 text-ink-soft">
      <div className="mx-auto max-w-7xl">
        {/* Main grid */}
        <div className="mb-16 grid grid-cols-[2fr_1fr_1fr_1fr] gap-16">
          {/* Brand column */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              {/* <Image
                src="/logo2.png"
                alt="Golden Dream Draw"
                width={150}
                height={40}
                className="h-auto w-auto "
              /> */}
              Golden Dream Draw
            </div>
            <p className="mb-6 text-sm leading-relaxed text-ink-muted">
              Skill-based prize competitions for the UK. Premium prizes, transparent draws, and real
              winners — every time.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-border-light bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-muted"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-5 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
                {heading}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm text-ink-soft transition-colors hover:text-gold-dark"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border pt-8">
          <p className="text-[13px] text-ink-muted">
            © 2026 Golden Dream Draw Ltd. All rights reserved. Golden Dream Draw is a skill-based
            competition platform. Not gambling. Licensed and regulated in the United Kingdom.
          </p>
          <div className="flex items-center gap-4">
            {["18+ Only", "🔒 SSL Encrypted", "Skill Competition"].map((badge) => (
              <span
                key={badge}
                className="rounded border border-border px-3.5 py-1.5 text-[11px] font-semibold text-ink-muted"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
