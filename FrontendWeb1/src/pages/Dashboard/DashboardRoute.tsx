import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import OperatorDashboardNew from "./OperatorDashboardNew";
import HomePage from "../advertiser/HomePage";

type UserSession = { role?: string } | null;

export default function DashboardRoute() {
  const [user, setUser] = useState<UserSession | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const stored = localStorage.getItem("user");
      return stored ? (JSON.parse(stored) as UserSession) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("user");
      setUser(stored ? (JSON.parse(stored) as UserSession) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const role = useMemo(() => (user?.role ?? "").toLowerCase(), [user]);

  // Pendant le chargement initial, ne redirige pas encore
  if (user === undefined) return null;

  if (role === "operator") return <OperatorDashboardNew />;
  if (role === "advertiser") return <HomePage />;

  // Pas connecté ou rôle inconnu -> page de connexion
  return <Navigate to="/signin" replace />;
}

