import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { useState } from "react";

const featureTabs = [
  {
    id: "matching",
    title: "AI team matching",
    metric: "94%",
    helper: "Compatibility",
    description: "Skill vectors and team-size rules surface balanced teams with clear match rationale.",
    bullets: ["Complementary skill gaps", "Team-size constraints", "Ranked recommendations"]
  },
  {
    id: "judging",
    title: "Judging cockpit",
    metric: "4.8x",
    helper: "Faster review",
    description: "Judges score submissions with weighted criteria, AI summaries, and live leaderboards.",
    bullets: ["Weighted rubric", "AI project insights", "Finalize and publish"]
  },
  {
    id: "operations",
    title: "Live operations",
    metric: "8+",
    helper: "Realtime events",
    description: "Organizers keep everyone aligned with WebSocket notifications and broadcast rooms.",
    bullets: ["Announcements", "Deadline warnings", "Results published"]
  }
];

const activity = [
  ["Team invite", "Pixel Pioneers invited Amina", "now"],
  ["AI review", "EcoTrack scored 86 overall", "2m"],
  ["Deadline", "Submissions close in 1 hour", "12m"],
  ["Certificate", "Verification ID generated", "18m"]
];

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(featureTabs[0]);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-20">
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              AI-powered hackathon operations suite
            </p>
            <h1 className="text-5xl font-black tracking-tight md:text-7xl">
              Run polished hackathons from launch to certificates.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              HackHub gives organizers a command center for events, teams, judging, AI insights,
              realtime communication, analytics, and verifiable participant certificates.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link className="btn-primary" to="/hackathons">
                Explore live hackathons
              </Link>
              <Link className="btn-secondary" to="/register">
                Start organizing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-400">
              {["Socket.IO realtime", "AI scoring", "PDF certificates", "RBAC"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="card interactive-card overflow-hidden p-0">
            <div className="border-b border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-cyan-200">Organizer cockpit</p>
                  <p className="text-xs text-slate-500">HackHub AI Launch Challenge</p>
                </div>
                <span className="badge">Live</span>
              </div>
            </div>
            <div className="grid gap-4 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric label="Registrations" value="428" trend="+18%" />
                <MiniMetric label="Teams formed" value="96" trend="+12%" />
                <MiniMetric label="Submissions" value="73" trend="+31%" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-bold">AI judging distribution</p>
                  <p className="text-xs text-cyan-200">Updating live</p>
                </div>
                {[82, 64, 91, 58, 76, 88, 69].map((height, index) => (
                  <span
                    key={index}
                    className="mr-2 inline-block w-8 rounded-t-xl bg-gradient-to-t from-violet-500 to-cyan-300 align-bottom"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
              <div className="space-y-3">
                {activity.map(([type, text, time]) => (
                  <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/40" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{type}</p>
                      <p className="truncate text-xs text-slate-400">{text}</p>
                    </div>
                    <span className="text-xs text-slate-500">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <StatCard label="Roles" value="5" helper="Admin, organizer, judge, mentor, participant" />
          <StatCard label="Realtime events" value="8+" helper="Invites, announcements, results, certificates" />
          <StatCard label="AI workflows" value="4" helper="Matching, scoring, similarity, analytics" />
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="card">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Interactive platform</p>
            <h2 className="mt-3 text-3xl font-black">Choose a workflow to preview</h2>
            <div className="mt-6 grid gap-3">
              {featureTabs.map((feature) => (
                <button
                  key={feature.id}
                  className={`tab-button text-left ${activeFeature.id === feature.id ? "tab-button-active" : ""}`}
                  onClick={() => setActiveFeature(feature)}
                >
                  {feature.title}
                </button>
              ))}
            </div>
          </div>
          <div className="card interactive-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{activeFeature.helper}</p>
                <p className="mt-1 text-5xl font-black text-cyan-200">{activeFeature.metric}</p>
              </div>
              <span className="badge">{activeFeature.title}</span>
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-300">{activeFeature.description}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {activeFeature.bullets.map((bullet) => (
                <div key={bullet} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" />
                  <p className="font-bold">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value, trend }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="text-xs font-bold text-emerald-300">{trend}</p>
    </div>
  );
}
