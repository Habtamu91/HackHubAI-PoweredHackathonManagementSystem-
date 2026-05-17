import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

export default function CertificateVerifyPage() {
  const { certId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["certificate", certId],
    queryFn: async () => (await api.get(`/certificates/${certId}`)).data.data
  });

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="card text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Certificate</p>
        <h1 className="mt-3 text-4xl font-black">Verification</h1>
        {isLoading ? <p className="mt-6 text-slate-400">Checking certificate...</p> : null}
        {data ? (
          <div className="mt-8 rounded-3xl bg-white/[0.04] p-6">
            <p className="text-xl font-bold">{data.user?.name}</p>
            <p className="mt-2 text-slate-400">{data.hackathon?.title}</p>
            <p className="mt-4 font-mono text-cyan-300">{data.verificationId}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
