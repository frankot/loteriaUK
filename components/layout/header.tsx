import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-transparent">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-12">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo2.png"
            alt="Golden Dream Draw"
            width={180}
            height={40}
            className="h-auto w-auto " 
            priority
          />
        </Link>

        <nav>
          <ul className="flex items-center gap-8">
            {[
              ["#trending", "Trending Prizes"],
              ["#how-it-works", "How It Works"],
              ["#winners", "Winners"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm font-medium text-ink-soft transition-colors hover:text-gold-dark"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-gold"
            title="Language — non-functional in mockup"
          >
            <span>🇬🇧</span> EN <span className="ml-0.5 text-[10px]">▾</span>
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-3xl border border-ink bg-transparent px-5 py-2 font-medium text-sm text-ink transition-all hover:bg-ink hover:text-white"
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
