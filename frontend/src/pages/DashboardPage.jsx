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

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Dashboard</p>
          <h1 className="mt-2 text-4xl font-black">Hi, {user?.name}</h1>
          <p className="mt-2 text-slate-400">Your role-aware HackHub command center.</p>
        </div>
        {["organizer", "admin"].includes(user?.role) ? (
          <Link className="btn-primary" to="/hackathons/create">
            Create hackathon
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Hackathons joined" value={user?.stats?.hackathonsJoined || 0} />
        <StatCard label="Wins" value={user?.stats?.hackathonsWon || 0} />
        <StatCard label="Submissions" value={user?.stats?.submissions || 0} />
        <StatCard label="Unread notifications" value={notifications?.pagination?.unread || 0} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="card">
          <h2 className="text-2xl font-bold">Upcoming hackathons</h2>
          <div className="mt-5 grid gap-4">
            {hackathons.map((hackathon) => (
              <Link key={hackathon._id} className="rounded-2xl border border-white/10 bg-slate-900 p-5 hover:border-cyan-300/50" to={`/hackathons/${hackathon.slug || hackathon._id}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{hackathon.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{hackathon.description}</p>
                  </div>
                  <span className="badge">{hackathon.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <div className="mt-5 space-y-3">
            {(notifications?.data || []).slice(0, 5).map((notification) => (
              <div key={notification._id} className="rounded-2xl bg-white/[0.04] p-4">
                <p className="font-semibold">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
              </div>
            ))}
            {!notifications?.data?.length ? <p className="text-slate-400">No notifications yet.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
