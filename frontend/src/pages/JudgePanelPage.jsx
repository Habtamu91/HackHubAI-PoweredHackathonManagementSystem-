import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { aiApi, judgeApi } from "../services/hackhubApi";

export default function JudgePanelPage() {
  const { hackathonId } = useParams();
  const queryClient = useQueryClient();
  const { data: submissions = [] } = useQuery({
    queryKey: ["judge", hackathonId, "submissions"],
    queryFn: () => judgeApi.submissions(hackathonId),
    enabled: Boolean(hackathonId && hackathonId !== "demo")
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ["judge", "assignments"],
    queryFn: judgeApi.assignments,
    enabled: hackathonId === "demo"
  });
  const scoreMutation = useMutation({
    mutationFn: (submissionId) =>
      judgeApi.score({
        submissionId,
        criteria: [
          { name: "Innovation", score: 85, maxScore: 100, weight: 0.35 },
          { name: "Technical Complexity", score: 82, maxScore: 100, weight: 0.35 },
          { name: "Impact", score: 80, maxScore: 100, weight: 0.3 }
        ],
        feedback: "Strong initial judge review."
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["judge", hackathonId, "submissions"] })
  });
  const aiMutation = useMutation({
    mutationFn: aiApi.evaluate
  });

  if (hackathonId === "demo") {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="card">
          <h1 className="text-4xl font-black">Judge assignments</h1>
          <div className="mt-6 grid gap-4">
            {assignments.map((assignment) => (
              <a key={assignment._id} className="rounded-2xl bg-white/[0.04] p-4 hover:bg-white/[0.07]" href={`/judge/${assignment._id}`}>
                <h2 className="font-bold">{assignment.title}</h2>
                <p className="text-sm text-slate-400">{assignment.status}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl font-black">Judge panel</h1>
      <div className="mt-8 grid gap-5">
        {submissions.map((submission) => (
          <div key={submission._id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="badge">{submission.status}</span>
                <h2 className="mt-3 text-2xl font-black">{submission.projectTitle}</h2>
                <p className="mt-2 text-slate-400">{submission.description}</p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary" onClick={() => aiMutation.mutate(submission._id)}>AI evaluate</button>
                <button className="btn-primary" onClick={() => scoreMutation.mutate(submission._id)}>Quick score</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
