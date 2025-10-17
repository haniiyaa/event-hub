import clsx from "clsx";

const variants = {
  default: "border-slate-700/60 bg-slate-900/70 text-slate-200",
  error: "border-red-500/40 bg-red-500/10 text-red-100",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  warning: "border-amber-400/60 bg-amber-500/10 text-amber-100",
};

export function Alert({
  variant = "default",
  title,
  description,
  className,
}: {
  variant?: keyof typeof variants;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border px-4 py-3", variants[variant], className)}>
      {title ? <h4 className="text-sm font-semibold">{title}</h4> : null}
      {description ? <p className="mt-1 text-sm/relaxed text-inherit/90">{description}</p> : null}
    </div>
  );
}
