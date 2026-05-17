import { useQuery } from "@tanstack/react-query";
import StatCard from "../components/StatCard";
import { hackathonApi } from "../services/hackhubApi";

export default function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ["admin", "hackathons"],
    queryFn: () => hackathonApi.list({ limit: 20 })
  });
  const hackathons = data?.data || data || [];
  const totals = hackathons.reduce(
    (acc, hackathon) => ({
      participants: acc.participants + (hackathon.stats?.participants || 0),
      teams: acc.teams + (hackathon.stats?.teams || 0),
      submissions: acc.submissions + (hackathon.stats?.submissions || 0)
    }),
    { participants: 0, teams: 0, submissions: 0 }
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Admin</p>
      <h1 className="mt-2 text-4xl font-black">Platform analytics</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Hackathons" value={hackathons.length} />
        <StatCard label="Participants" value={totals.participants} />
        <StatCard label="Teams" value={totals.teams} />
        <StatCard label="Submissions" value={totals.submissions} />
      </div>
      <div className="mt-10 card">
        <h2 className="text-2xl font-bold">Operational snapshot</h2>
        <div className="mt-5 space-y-3">
          {hackathons.map((hackathon) => (
            <div key={hackathon._id} className="grid gap-3 rounded-2xl bg-white/[0.04] p-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-semibold">{hackathon.title}</p>
                <p className="text-sm text-slate-400">{hackathon.status}</p>
              </div>
              <p className="text-sm text-slate-400">
                {hackathon.stats?.participants || 0} participants / {hackathon.stats?.submissions || 0} submissions
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
