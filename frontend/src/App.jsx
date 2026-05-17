import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import CertificateVerifyPage from "./pages/CertificateVerifyPage";
import DashboardPage from "./pages/DashboardPage";
import { CreateHackathonPage, HackathonDetailPage, HackathonListPage } from "./pages/HackathonPages";
import JudgePanelPage from "./pages/JudgePanelPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LandingPage from "./pages/LandingPage";
import TeamDashboardPage from "./pages/TeamDashboardPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/hackathons" element={<HackathonListPage />} />
        <Route path="/hackathons/:id" element={<HackathonDetailPage />} />
        <Route path="/certificates/:certId" element={<CertificateVerifyPage />} />
        <Route path="/leaderboard/:hackathonId" element={<LeaderboardPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hackathons/create"
          element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <CreateHackathonPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:id"
          element={
            <ProtectedRoute>
              <TeamDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judge/:hackathonId"
          element={
            <ProtectedRoute roles={["judge", "organizer", "admin"]}>
              <JudgePanelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
