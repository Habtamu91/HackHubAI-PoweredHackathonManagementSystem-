import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";

const differentiators = [
  "AI team matching",
  "GPT-ready project evaluation",
  "Similarity detection",
  "Real-time notifications",
  "Tamper-evident certificates",
  "Role-based dashboards"
];

export default function LandingPage() {
  return (
    <section className="relative overflow-hidden px-4 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.28),_transparent_35%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
            AI-powered hackathon operations
          </p>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Manage every hackathon lifecycle in one intelligent hub.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            HackHub connects organizers, participants, mentors, and judges with automated event
            setup, smart team formation, judging workflows, analytics, certificates, and live
            notifications.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link className="btn-primary" to="/hackathons">
              Explore hackathons
            </Link>
            <Link className="btn-secondary" to="/register">
              Create account
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <StatCard label="Roles" value="5" helper="Admin, organizer, judge, mentor, participant" />
          <StatCard label="Realtime events" value="8+" helper="Invites, announcements, results, certificates" />
          <StatCard label="AI workflows" value="4" helper="Matching, scoring, similarity, analytics" />
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {differentiators.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <div className="mb-4 h-2 w-16 rounded-full bg-gradient-to-r from-cyan-300 to-electric" />
              <h3 className="text-lg font-bold">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
