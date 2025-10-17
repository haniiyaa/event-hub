"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { useSession } from "@/providers/session-provider";

const personas = [
  {
    title: "Students",
    description:
      "Browse and register for club events in seconds, then stay on top of RSVPs and instructions from one dashboard.",
    actions: ["Discover events", "Manage registrations", "Review instructions"],
  },
  {
    title: "Club Admins",
    description:
      "Plan, publish, and manage club programming with smart capacity checks and automated instruction feeds.",
    actions: ["Create events", "Broadcast updates", "Monitor attendance"],
  },
  {
    title: "Super Admins",
    description:
      "Oversee campus engagement at a glance, manage permissions, and audit recent activity securely.",
    actions: ["Manage users", "Review analytics", "Enforce policies"],
  },
];

const workflow = [
  {
    title: "Plan & Publish",
    description:
      "Create event briefs, update club information, and set capacity rules in one workspace synced with admin approvals.",
  },
  {
    title: "Promote & Engage",
    description:
      "Students discover club happenings through personalized feeds and subscribe to just-in-time instructions from organizers.",
  },
  {
    title: "Track & Report",
    description:
      "Live dashboards surface club health, registrations, waitlists, and check-in metrics for administrators in real time.",
  },
];

const stats = [
  { value: "120+", label: "Events hosted each semester" },
  { value: "6k", label: "Active student registrations" },
  { value: "35", label: "Clubs collaborating on Event Hub" },
];

export default function Home() {
  const { user } = useSession();
  const primaryCta = user
    ? { href: "/app/events", label: "Browse upcoming events" }
    : { href: "/login", label: "Log in to explore events" };
  const secondaryCta = user
    ? { href: "/app/registrations", label: "View my registrations" }
    : { href: "/register", label: "Create student account" };
  const tertiaryCta = { href: "#personas", label: "See how it works" };
  const architectureGuideHref = "https://github.com/haniiyaa/event-hub/blob/main/docs/frontend-architecture.md";

  return (
    <div className="relative overflow-hidden py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.14),_transparent_55%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 sm:px-10">
        <header className="flex flex-col gap-8 text-center sm:gap-10 sm:text-left">
          <div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 sm:self-start">
            Event & Club Management
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Manage campus events and clubs efficiently with <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">Event Hub</span>
          </h1>
          <p className="max-w-3xl text-balance text-lg text-slate-200 sm:text-xl">
            Event Hub streamlines planning, promotion, and reporting so every stakeholder can keep campus clubs thriving. From publishing event details to monitoring attendance, everything your team needs lives in one efficient web app.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            <Link
              href={primaryCta.href}
              className={buttonClasses({ size: "lg", className: "px-6 py-3 text-base" })}
            >
              {primaryCta.label}
            </Link>
            <Link
              href={secondaryCta.href}
              className={buttonClasses({ variant: "secondary", size: "lg", className: "px-6 py-3 text-base" })}
            >
              {secondaryCta.label}
            </Link>
            <Link
              href={tertiaryCta.href}
              className={buttonClasses({ variant: "ghost", size: "lg", className: "px-6 py-3 text-base text-slate-100" })}
            >
              {tertiaryCta.label}
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            Need implementation details?{' '}
            <a
              href={architectureGuideHref}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-200 transition hover:text-sky-100"
            >
              Read the frontend architecture guide ↗
            </a>
          </p>
        </header>

        <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg sm:grid-cols-3" id="personas">
          {personas.map((persona) => (
            <article
              key={persona.title}
              className="flex flex-col gap-4 rounded-2xl bg-slate-950/60 p-6 shadow-[0_25px_60px_-35px_rgba(14,116,144,0.6)]"
            >
              <div>
                <h2 className="text-lg font-semibold text-sky-200">{persona.title}</h2>
                <p className="mt-2 text-sm text-slate-200/90">{persona.description}</p>
              </div>
              <ul className="mt-auto space-y-2 text-sm text-slate-300">
                {persona.actions.map((action) => (
                  <li key={action} className="flex items-center gap-2">
                    <span aria-hidden className="text-sky-300">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-slate-100">Built around your event lifecycle</h2>
            <p className="text-sm text-slate-300">
              Each phase of the workflow maps directly to the REST endpoints you exposed in the backend. Connect your API client to bring these surfaces to life.
            </p>
            <ol className="space-y-6">
              {workflow.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-400/20 text-base font-semibold text-sky-200">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                    <p className="text-sm text-slate-300/90">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-slate-950 p-8 text-slate-200 shadow-[0_25px_60px_-35px_rgba(56,189,248,0.5)]">
            <div>
              <h2 className="text-2xl font-semibold text-white">API-ready UI kit</h2>
              <p className="mt-3 text-sm text-slate-300">
                Scaffold pages quickly with reusable cards, timeline primitives, and responsive layout tokens configured for Tailwind + Next.js.
              </p>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-emerald-300">✓</span>
                Tailwind, TypeScript, and Next.js App Router
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-emerald-300">✓</span>
                Dark-first palette aligned with backend identity
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-emerald-300">✓</span>
                Ready to hook into auth + event endpoints
              </li>
            </ul>
            <Link
              href="#next-steps"
              className="inline-flex w-fit items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/50"
            >
              View next steps ↘
            </Link>
          </aside>
        </section>

        <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur" id="next-steps">
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-white">Make it production-ready</h2>
            <p className="text-sm text-slate-300">
              Prioritize these tasks next to deliver a fully interactive campus hub.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Wire up authentication",
                description:
                  "Connect the login and registration flows to the Spring Boot auth endpoints using secure fetch helpers.",
              },
              {
                title: "Event data fetching",
                description:
                  "Use server components or React Query to stream public event listings and hydrate dashboards.",
              },
              {
                title: "Role-based routing",
                description:
                  "Gate club admin and super admin areas with middleware that inspects the user role returned by the API.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl bg-slate-950/60 p-6">
                <h3 className="text-lg font-semibold text-sky-200">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-300/90">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h2 className="text-2xl font-semibold text-white">Campus impact at a glance</h2>
            <p className="text-sm text-slate-300">
              Sync this view with analytics endpoints to keep leadership up to date.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 text-center"
              >
                <div className="text-3xl font-semibold text-white">{stat.value}</div>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-semibold text-white">Ready to connect the dots?</h2>
            <p className="mt-1 text-sm text-slate-300">
              Pair this Next.js surface with the secured Event Hub API and launch your new campus experience.
            </p>
          </div>
          <Link
            href="mailto:team@eventhub.edu"
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-[1px] hover:bg-emerald-300"
          >
            Share feedback
          </Link>
        </footer>
      </div>
    </div>
  );
}
