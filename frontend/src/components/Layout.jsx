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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-2xl font-black tracking-tight">
            <span className="text-cyan-300">Hack</span>Hub
          </Link>
          <nav className="hidden gap-5 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-cyan-300" : "text-slate-300 hover:text-white"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-300 sm:inline">
                  {user.name} ({user.role})
                </span>
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
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
