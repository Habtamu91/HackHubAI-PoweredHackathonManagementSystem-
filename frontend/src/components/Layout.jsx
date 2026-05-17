import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navItems = [
  { to: "/hackathons", label: "Hackathons" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/judge/demo", label: "Judge" },
  { to: "/admin", label: "Admin" }
];

export default function Layout() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80">
        <div className="orb absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="orb absolute right-[-10rem] top-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl [animation-delay:1.5s]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      </div>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="group flex items-center gap-3 text-2xl font-black tracking-tight" onClick={() => setMenuOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950 shadow-lg shadow-cyan-950/30 transition group-hover:rotate-6">
              HH
            </span>
            <span>
              <span className="text-cyan-300">Hack</span>Hub
            </span>
          </Link>
          <nav className="hidden gap-5 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-pill ${isActive ? "nav-pill-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-4 sm:flex">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-300/15 text-sm font-black text-cyan-200">
                    {user.name?.slice(0, 1) || "U"}
                  </span>
                  <span className="text-sm text-slate-300">
                    {user.name} <span className="text-slate-500">/{user.role}</span>
                  </span>
                </div>
                <button className="btn-secondary" onClick={clearSession}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn-secondary" to="/login">
                  Login
                </Link>
                <Link className="btn-primary" to="/register">
                  Join
                </Link>
              </>
            )}
            <button
              className="btn-secondary px-3 md:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="mx-auto grid max-w-7xl gap-2 px-4 pb-4 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `nav-pill ${isActive ? "nav-pill-active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
      </header>
      <main className="relative z-10">
        <Outlet />
      </main>
      <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
        HackHub blends AI matching, real-time operations, judging workflows, and verifiable certificates.
      </footer>
    </div>
  );
}
