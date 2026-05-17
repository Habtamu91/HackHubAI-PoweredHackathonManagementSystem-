import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { aiApi, hackathonApi, teamApi } from "../services/hackhubApi";
import { useAuthStore } from "../store/authStore";

const statusFilters = ["all", "published", "registration_open", "ongoing", "judging"];
const detailTabs = ["Overview", "Scoring", "Prizes"];

export function HackathonListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["hackathons", search, status],
    queryFn: () => hackathonApi.list({ search, status: status === "all" ? undefined : status })
  });
  const hackathons = data?.data || data || [];
  const featured = hackathons[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Explore</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Discover high-signal hackathons</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Search, filter, and jump into events with live stats, deadlines, team rules, and AI-assisted workflows.
          </p>
        </div>
        <div className="w-full max-w-md">
          <input className="input" placeholder="Search by title, theme, or technology" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {statusFilters.map((item) => (
          <button
            key={item}
            className={`tab-button ${status === item ? "tab-button-active" : ""}`}
            onClick={() => setStatus(item)}
          >
            {item.replace("_", " ")}
          </button>
        ))}
      </div>

      {featured && !isLoading ? (
        <Link
          to={`/hackathons/${featured.slug || featured._id}`}
          className="card interactive-card mt-8 grid overflow-hidden p-0 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="p-7 md:p-8">
            <span className="badge">Featured event</span>
            <h2 className="mt-4 text-3xl font-black md:text-4xl">{featured.title}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">{featured.description}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Metric label="Participants" value={featured.stats?.participants || 0} />
              <Metric label="Teams" value={featured.stats?.teams || 0} />
              <Metric label="Submissions" value={featured.stats?.submissions || 0} />
            </div>
          </div>
          <div className="border-t border-white/10 bg-slate-950/50 p-7 lg:border-l lg:border-t-0">
            <p className="text-sm font-bold text-cyan-200">Event timeline</p>
            <TimelineMini hackathon={featured} />
          </div>
        </Link>
      ) : null}

      {isLoading ? <HackathonSkeleton /> : null}
      {!isLoading && hackathons.length === 0 ? (
        <div className="card mt-8 text-center">
          <p className="text-2xl font-black">No hackathons found</p>
          <p className="mt-2 text-slate-400">Try a different search or status filter.</p>
        </div>
      ) : null}
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {hackathons.map((hackathon) => (
          <HackathonCard key={hackathon._id} hackathon={hackathon} />
        ))}
      </div>
    </section>
  );
}

export function HackathonDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("Overview");
  const queryClient = useQueryClient();
  const { data: hackathon, isLoading } = useQuery({
    queryKey: ["hackathon", id],
    queryFn: () => hackathonApi.get(id)
  });
  const registerMutation = useMutation({
    mutationFn: () => hackathonApi.register(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hackathon", id] })
  });
  const matchMutation = useMutation({
    mutationFn: () => aiApi.teamMatch({ hackathonId: hackathon?._id })
  });

  if (isLoading) return <p className="mx-auto max-w-7xl px-4 py-10 text-slate-400">Loading...</p>;
  if (!hackathon) return null;
  const daysToDeadline = getDaysUntil(hackathon.submissionDeadline);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card interactive-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <span className="badge">{hackathon.status}</span>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Deadline</p>
              <p className="text-xl font-black text-cyan-200">{daysToDeadline} days</p>
            </div>
          </div>
          <h1 className="mt-4 text-5xl font-black">{hackathon.title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">{hackathon.description}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <DatePill label="Registration closes" value={hackathon.registrationEnd} />
            <DatePill label="Starts" value={hackathon.startDate} />
            <DatePill label="Submissions due" value={hackathon.submissionDeadline} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <button className="btn-primary" onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending}>
                Register
              </button>
            ) : (
              <Link className="btn-primary" to="/login">Login to register</Link>
            )}
            {user?.role === "participant" ? (
              <button className="btn-secondary" onClick={() => matchMutation.mutate()} disabled={matchMutation.isPending}>
                Get AI team matches
              </button>
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {detailTabs.map((tab) => (
              <button
                key={tab}
                className={`tab-button ${activeTab === tab ? "tab-button-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <DetailTabContent activeTab={activeTab} hackathon={hackathon} />
        </div>
        <div className="space-y-5">
          <CreateTeamPanel hackathonId={hackathon._id} />
          <div className="card interactive-card">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">AI recommendations</h2>
              {matchMutation.isPending ? <span className="badge">Thinking</span> : null}
            </div>
            <div className="mt-4 space-y-3">
              {(matchMutation.data?.recommendations || []).map((item, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Match score</p>
                    <p className="text-2xl font-black text-cyan-200">{item.aiMatchScore}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${item.aiMatchScore}%` }} />
                  </div>
                  <p className="text-sm text-slate-400">{item.rationale}</p>
                </div>
              ))}
              {!matchMutation.data ? <p className="text-sm text-slate-400">Run AI matching to see compatible participants.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DatePill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 font-bold">{value ? new Date(value).toLocaleString() : "TBD"}</p>
    </div>
  );
}

function CreateTeamPanel({ hackathonId }) {
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState("");
  const mutation = useMutation({
    mutationFn: () => teamApi.create({ hackathonId, name })
  });
  if (user?.role !== "participant") return null;
  return (
    <div className="card interactive-card">
      <h2 className="text-xl font-bold">Create a team</h2>
      <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <input className="input" value={name} placeholder="Team name" onChange={(event) => setName(event.target.value)} />
        <button className="btn-primary w-full" disabled={mutation.isPending || !name}>Create team</button>
      </form>
      {mutation.data ? <p className="mt-3 text-sm text-cyan-300">Team created: {mutation.data.name}</p> : null}
    </div>
  );
}

function HackathonCard({ hackathon }) {
  const percent = Math.min(100, Math.round(((hackathon.stats?.participants || 0) / 500) * 100));

  return (
    <Link to={`/hackathons/${hackathon.slug || hackathon._id}`} className="card interactive-card group">
      <div className="flex items-start justify-between gap-4">
        <span className="badge">{hackathon.status}</span>
        <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-400 group-hover:text-cyan-200">
          View event
        </span>
      </div>
      <h2 className="mt-4 text-2xl font-black">{hackathon.title}</h2>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{hackathon.description}</p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${Math.max(percent, 12)}%` }} />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
        <Metric label="people" value={hackathon.stats?.participants || 0} />
        <Metric label="teams" value={hackathon.stats?.teams || 0} />
        <Metric label="projects" value={hackathon.stats?.submissions || 0} />
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
        <strong className="text-white">Due:</strong> {formatDate(hackathon.submissionDeadline)}
      </div>
    </Link>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <strong className="text-lg text-white">{value}</strong>
      <span className="block text-xs text-slate-500">{label}</span>
    </div>
  );
}

function TimelineMini({ hackathon }) {
  const items = [
    ["Registration", hackathon.registrationEnd],
    ["Starts", hackathon.startDate],
    ["Submit", hackathon.submissionDeadline],
    ["Finale", hackathon.endDate]
  ];
  return (
    <div className="mt-5 space-y-4">
      {items.map(([label, date], index) => (
        <div key={label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-xs font-black text-cyan-200">
              {index + 1}
            </span>
            {index < items.length - 1 ? <span className="h-8 w-px bg-white/10" /> : null}
          </div>
          <div>
            <p className="font-bold">{label}</p>
            <p className="text-sm text-slate-400">{formatDate(date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailTabContent({ activeTab, hackathon }) {
  if (activeTab === "Scoring") {
    return (
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {(hackathon.scoringCriteria || []).map((criterion) => (
          <div key={criterion.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-bold">{criterion.name}</p>
            <p className="mt-2 text-sm text-slate-400">Max {criterion.maxScore} points</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${criterion.weight * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{Math.round(criterion.weight * 100)}% weight</p>
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === "Prizes") {
    return (
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {(hackathon.prizes || []).length ? (
          hackathon.prizes.map((prize) => (
            <div key={`${prize.rank}-${prize.title}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <span className="badge">Rank {prize.rank}</span>
              <p className="mt-3 text-xl font-black">{prize.title}</p>
              <p className="mt-2 text-sm text-slate-400">{prize.description}</p>
              <p className="mt-3 font-bold text-cyan-200">{prize.value}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-400">Prize information will be announced soon.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      <Metric label="participants" value={hackathon.stats?.participants || 0} />
      <Metric label="teams" value={hackathon.stats?.teams || 0} />
      <Metric label="submissions" value={hackathon.stats?.submissions || 0} />
    </div>
  );
}

function HackathonSkeleton() {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="card">
          <div className="shimmer h-6 w-24 rounded-full" />
          <div className="shimmer mt-5 h-8 w-3/4 rounded-xl" />
          <div className="shimmer mt-4 h-20 rounded-2xl" />
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="shimmer h-16 rounded-xl" />
            <div className="shimmer h-16 rounded-xl" />
            <div className="shimmer h-16 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getDaysUntil(value) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

function formatDate(value) {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function CreateHackathonPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    registrationStart: "",
    registrationEnd: "",
    startDate: "",
    endDate: "",
    submissionDeadline: ""
  });
  const mutation = useMutation({
    mutationFn: hackathonApi.create,
    onSuccess: (hackathon) => navigate(`/hackathons/${hackathon.slug}`)
  });
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="card">
        <h1 className="text-4xl font-black">Create hackathon</h1>
        <form className="mt-8 grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
          <input className="input" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <textarea className="input min-h-32" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          {["registrationStart", "registrationEnd", "startDate", "endDate", "submissionDeadline"].map((field) => (
            <label key={field} className="text-sm text-slate-300">
              {field}
              <input className="input mt-1" type="datetime-local" value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
            </label>
          ))}
          <button className="btn-primary" disabled={mutation.isPending}>Create</button>
        </form>
      </div>
    </section>
  );
}
