export default function StatCard({ label, value, helper }) {
  return (
    <div className="interactive-card rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/10">
      <div className="mb-5 h-1.5 w-14 rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" />
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}
