import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { aiApi, hackathonApi, teamApi } from "../services/hackhubApi";
import { useAuthStore } from "../store/authStore";

export function HackathonListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["hackathons", search],
    queryFn: () => hackathonApi.list({ search })
  });
  const hackathons = data?.data || data || [];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Explore</p>
          <h1 className="mt-2 text-4xl font-black">Public hackathons</h1>
        </div>
        <input className="input max-w-sm" placeholder="Search hackathons" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      {isLoading ? <p className="mt-8 text-slate-400">Loading...</p> : null}
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {hackathons.map((hackathon) => (
          <Link key={hackathon._id} to={`/hackathons/${hackathon.slug || hackathon._id}`} className="card hover:border-cyan-300/50">
            <span className="badge">{hackathon.status}</span>
            <h2 className="mt-4 text-2xl font-black">{hackathon.title}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{hackathon.description}</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl bg-white/[0.04] p-3">
                <strong>{hackathon.stats?.participants || 0}</strong>
                <span className="block text-slate-500">people</span>
              </div>
              <div className="rounded-xl bg-white/[0.04] p-3">
                <strong>{hackathon.stats?.teams || 0}</strong>
                <span className="block text-slate-500">teams</span>
              </div>
              <div className="rounded-xl bg-white/[0.04] p-3">
                <strong>{hackathon.stats?.submissions || 0}</strong>
                <span className="block text-slate-500">projects</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HackathonDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
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

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card">
          <span className="badge">{hackathon.status}</span>
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
        </div>
        <div className="space-y-5">
          <CreateTeamPanel hackathonId={hackathon._id} />
          <div className="card">
            <h2 className="text-xl font-bold">AI recommendations</h2>
            <div className="mt-4 space-y-3">
              {(matchMutation.data?.recommendations || []).map((item, index) => (
                <div key={index} className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="font-semibold">Match score {item.aiMatchScore}</p>
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
    <div className="rounded-2xl bg-slate-900 p-4">
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
    <div className="card">
      <h2 className="text-xl font-bold">Create a team</h2>
      <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <input className="input" value={name} placeholder="Team name" onChange={(event) => setName(event.target.value)} />
        <button className="btn-primary w-full" disabled={mutation.isPending || !name}>Create team</button>
      </form>
      {mutation.data ? <p className="mt-3 text-sm text-cyan-300">Team created: {mutation.data.name}</p> : null}
    </div>
  );
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
