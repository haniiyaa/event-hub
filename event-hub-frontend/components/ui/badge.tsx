import clsx from "clsx";

const baseStyles = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]";

const variants = {
  default: "border-white/20 text-slate-200",
  success: "border-emerald-400/50 text-emerald-200",
  warning: "border-amber-400/70 text-amber-200",
  info: "border-sky-400/60 text-sky-200",
};

export function Badge({ variant = "default", children, className }: { variant?: keyof typeof variants; children: React.ReactNode; className?: string }) {
  return <span className={clsx(baseStyles, variants[variant], className)}>{children}</span>;
}
