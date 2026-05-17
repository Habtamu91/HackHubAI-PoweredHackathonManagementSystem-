import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { hackathonApi, notificationApi } from "../services/hackhubApi";
import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: hackathonData } = useQuery({
    queryKey: ["hackathons", "dashboard"],
    queryFn: () => hackathonApi.list({ limit: 6 })
  });
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.list,
    enabled: Boolean(user)
  });

  const hackathons = hackathonData?.data || hackathonData || [];
  const progress = Math.min(100, hackathons.length * 18 + (notifications?.pagination?.unread || 0) * 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="card interactive-card grid gap-8 overflow-hidden lg:grid-cols-[1fr_0.7fr]">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Dashboard</p>
            <h1 className="mt-2 text-4xl font-black md:text-5xl">Welcome back, {user?.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Your role-aware command center for hackathons, teams, judging actions, notifications, and progress.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/hackathons">
              Explore events
            </Link>
            {["organizer", "admin"].includes(user?.role) ? (
              <Link className="btn-secondary" to="/hackathons/create">
                Create hackathon
              </Link>
            ) : null}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between">
            <p className="font-bold">Activity readiness</p>
            <span className="badge">{user?.role || "member"}</span>
          </div>
          <div className="mt-6 grid place-items-center">
            <div
              className="relative grid h-44 w-44 place-items-center rounded-full"
              style={{
                background: `conic-gradient(from 180deg, #67e8f9 ${progress}%, rgba(255,255,255,0.08) 0)`
              }}
            >
              <div className="grid h-32 w-32 place-items-center rounded-full bg-slate-950">
                <div className="text-center">
                  <p className="text-4xl font-black">{progress}%</p>
                  <p className="text-xs text-slate-500">ready</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-slate-400">Based on event activity and unread notifications.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Hackathons joined" value={user?.stats?.hackathonsJoined || 0} />
        <StatCard label="Wins" value={user?.stats?.hackathonsWon || 0} />
        <StatCard label="Submissions" value={user?.stats?.submissions || 0} />
        <StatCard label="Unread notifications" value={notifications?.pagination?.unread || 0} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="card interactive-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Upcoming hackathons</h2>
            <Link className="text-sm font-bold text-cyan-200" to="/hackathons">View all</Link>
          </div>
          <div className="mt-5 grid gap-4">
            {hackathons.map((hackathon) => (
              <Link key={hackathon._id} className="interactive-card rounded-2xl border border-white/10 bg-slate-900/70 p-5" to={`/hackathons/${hackathon.slug || hackathon._id}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{hackathon.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{hackathon.description}</p>
                  </div>
                  <span className="badge">{hackathon.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
                  <span className="rounded-xl bg-white/[0.04] p-2">{hackathon.stats?.participants || 0} people</span>
                  <span className="rounded-xl bg-white/[0.04] p-2">{hackathon.stats?.teams || 0} teams</span>
                  <span className="rounded-xl bg-white/[0.04] p-2">{hackathon.stats?.submissions || 0} projects</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card interactive-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <span className="badge">{notifications?.pagination?.unread || 0} unread</span>
          </div>
          <div className="mt-5 space-y-3">
            {(notifications?.data || []).slice(0, 5).map((notification) => (
              <div key={notification._id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                  <div>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
                  </div>
                </div>
              </div>
            ))}
            {!notifications?.data?.length ? <p className="text-slate-400">No notifications yet.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
