import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { judgeApi } from "../services/hackhubApi";

export default function LeaderboardPage() {
  const { hackathonId } = useParams();
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard", hackathonId],
    queryFn: () => judgeApi.leaderboard(hackathonId),
    refetchInterval: 30_000
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="card">
        <h1 className="text-4xl font-black">Leaderboard</h1>
        <div className="mt-8 space-y-3">
          {leaderboard.map((item) => (
            <div key={item.submissionId} className="grid items-center gap-4 rounded-2xl bg-white/[0.04] p-4 md:grid-cols-[80px_1fr_120px]">
              <p className="text-3xl font-black text-cyan-300">#{item.rank}</p>
              <div>
                <p className="font-bold">{item.projectTitle}</p>
                <p className="text-sm text-slate-400">{item.team?.name}</p>
              </div>
              <p className="text-xl font-black">{Math.round(item.finalScore)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
