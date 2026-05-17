import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { submissionApi, teamApi } from "../services/hackhubApi";
import { useState } from "react";

export default function TeamDashboardPage() {
  const { id } = useParams();
  const { data: team } = useQuery({
    queryKey: ["team", id],
    queryFn: () => teamApi.get(id)
  });
  const [submission, setSubmission] = useState({
    projectTitle: "",
    description: "",
    githubUrl: "",
    techStack: ""
  });
  const mutation = useMutation({
    mutationFn: () =>
      submissionApi.create({
        ...submission,
        teamId: id,
        techStack: submission.techStack.split(",").map((item) => item.trim()).filter(Boolean)
      })
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card">
          <span className="badge">{team?.status || "team"}</span>
          <h1 className="mt-4 text-4xl font-black">{team?.name || "Team"}</h1>
          <p className="mt-2 text-slate-400">{team?.hackathon?.title}</p>
          <h2 className="mt-8 text-xl font-bold">Members</h2>
          <div className="mt-4 space-y-3">
            {(team?.members || []).map((member) => (
              <div key={member.user._id} className="rounded-2xl bg-white/[0.04] p-4">
                <p className="font-semibold">{member.user.name}</p>
                <p className="text-sm text-slate-400">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="text-2xl font-bold">Submission draft</h2>
          <form className="mt-6 grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
            <input className="input" placeholder="Project title" onChange={(event) => setSubmission({ ...submission, projectTitle: event.target.value })} />
            <textarea className="input min-h-36" placeholder="Description" onChange={(event) => setSubmission({ ...submission, description: event.target.value })} />
            <input className="input" placeholder="GitHub URL" onChange={(event) => setSubmission({ ...submission, githubUrl: event.target.value })} />
            <input className="input" placeholder="Tech stack (comma-separated)" onChange={(event) => setSubmission({ ...submission, techStack: event.target.value })} />
            <button className="btn-primary" disabled={mutation.isPending}>Save submission</button>
          </form>
          {mutation.data ? <p className="mt-4 text-cyan-300">Submission saved: {mutation.data.projectTitle}</p> : null}
        </div>
      </div>
    </section>
  );
}
