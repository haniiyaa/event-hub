import clsx from "clsx";

export function Label({ children, className, htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={clsx("text-sm font-semibold uppercase tracking-[0.2em] text-slate-400", className)}>
      {children}
    </label>
  );
}
