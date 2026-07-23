import Link from "next/link";

const VARIANTS = {
  dark: "bg-foreground text-background hover:bg-primary",
  light: "bg-background text-foreground hover:bg-accent",
  glass:
    "border border-background/20 bg-background/10 backdrop-blur-md text-background hover:bg-background/20 hover:border-background/40",
} as const;

interface RollLinkProps {
  href: string;
  label: string;
  variant?: keyof typeof VARIANTS;
  external?: boolean;
}

const splitLabel = (label: string) => Array.from(label);

/** Pill CTA with the theme's per-letter dual-text hover roll. Pure CSS, safe in Server Components. */
export function RollLink({ href, label, variant = "dark", external }: RollLinkProps) {
  const letters = splitLabel(label);

  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={label}
      className={`group inline-flex items-center justify-center rounded-full px-[30px] py-[18px] text-[10px] md:text-[11px] font-medium uppercase tracking-[0.25em] font-body transition-colors duration-300 ${VARIANTS[variant]}`}
    >
      <span aria-hidden className="relative block h-[14px] overflow-hidden">
        <span className="flex leading-[14px]">
          {letters.map((letter, index) => (
            <span
              key={`top-${letter}-${index}`}
              className="inline-block transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:-translate-y-[150%]"
              style={{ transitionDelay: `${index * 20}ms` }}
            >
              {letter === " " ? "\u00a0" : letter}
            </span>
          ))}
        </span>
        <span className="absolute left-0 top-0 flex leading-[14px]">
          {letters.map((letter, index) => (
            <span
              key={`bottom-${letter}-${index}`}
              className="inline-block translate-y-[150%] transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:translate-y-0"
              style={{ transitionDelay: `${index * 20}ms` }}
            >
              {letter === " " ? "\u00a0" : letter}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}
