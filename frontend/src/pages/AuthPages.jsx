import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/hackhubApi";
import { useAuthStore } from "../store/authStore";

const roleOptions = ["participant", "organizer", "judge", "mentor"];

function AuthCard({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden lg:block">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Secure workspace</p>
        <h2 className="mt-3 text-5xl font-black">Your gateway to AI-powered hackathon operations.</h2>
        <div className="mt-8 grid gap-4">
          {["Memory-safe access tokens", "Role-aware dashboards", "Realtime event updates"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-bold">{item}</p>
              <p className="mt-1 text-sm text-slate-400">Designed for organizers, participants, judges, mentors, and admins.</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card interactive-card w-full">
        <span className="badge">HackHub account</span>
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: "", password: "" });
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data);
      navigate("/dashboard");
    }
  });

  return (
    <AuthCard title="Welcome back" subtitle="Continue managing teams, events, judging, and notifications from one polished cockpit.">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
        <input className="input" placeholder="Email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="input" type="password" placeholder="Password" onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {mutation.error ? <p className="text-sm text-red-300">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
        <button className="btn-primary w-full" disabled={mutation.isPending}>{mutation.isPending ? "Signing in..." : "Login"}</button>
      </form>
      <p className="mt-5 text-sm text-slate-400">
        New to HackHub? <Link className="text-cyan-300" to="/register">Create an account</Link>
      </p>
    </AuthCard>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "participant",
    skills: ""
  });
  const mutation = useMutation({
    mutationFn: (payload) =>
      authApi.register({
        ...payload,
        skills: payload.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      }),
    onSuccess: (data) => {
      setSession(data);
      navigate("/dashboard");
    }
  });

  return (
    <AuthCard title="Join HackHub" subtitle="Create a role-aware account and start collaborating in modern hackathon workflows.">
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
        <input className="input" placeholder="Name" onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="input" placeholder="Email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="input" type="password" placeholder="Password" onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <select className="input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <input className="input" placeholder="Skills (React, Python, ML)" onChange={(event) => setForm({ ...form, skills: event.target.value })} />
        {mutation.error ? <p className="text-sm text-red-300">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
        <button className="btn-primary w-full" disabled={mutation.isPending}>{mutation.isPending ? "Creating account..." : "Create account"}</button>
      </form>
    </AuthCard>
  );
}
