import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/hackhubApi";
import { useAuthStore } from "../store/authStore";

const roleOptions = ["participant", "organizer", "judge", "mentor"];

function AuthCard({ title, children }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <h1 className="text-3xl font-black">{title}</h1>
        {children}
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
    <AuthCard title="Welcome back">
      <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
        <input className="input" placeholder="Email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="input" type="password" placeholder="Password" onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {mutation.error ? <p className="text-sm text-red-300">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
        <button className="btn-primary w-full" disabled={mutation.isPending}>Login</button>
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
    <AuthCard title="Join HackHub">
      <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
        <input className="input" placeholder="Name" onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="input" placeholder="Email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="input" type="password" placeholder="Password" onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <select className="input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <input className="input" placeholder="Skills (React, Python, ML)" onChange={(event) => setForm({ ...form, skills: event.target.value })} />
        {mutation.error ? <p className="text-sm text-red-300">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
        <button className="btn-primary w-full" disabled={mutation.isPending}>Create account</button>
      </form>
    </AuthCard>
  );
}
