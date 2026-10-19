import { useEffect, useState } from "react";
import { recordLoginTime } from "../utils/device";

export function useAppController() {
  const [activeScreen, setActiveScreen] = useState("Dashboard");
  const [appLoading, setAppLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => window.location.hash === "#/dashboard");

  const login = () => {
    recordLoginTime();
    setAuthenticated(true);
    setActiveScreen("Dashboard");
    setAppLoading(true);
    window.location.hash = "/dashboard";
    window.setTimeout(() => setAppLoading(false), 1400);
  };

  const logout = () => {
    window.sessionStorage.removeItem("pal-login-time");
    setAuthenticated(false);
    setActiveScreen("Dashboard");
    setSidebarOpen(false);
    setAppLoading(false);
    window.location.hash = "/login";
  };

  const navigate = (screen: string) => {
    setActiveScreen(screen);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!window.location.hash) window.location.hash = "/login";
    if (window.location.hash === "#/dashboard" && !window.sessionStorage.getItem("pal-login-time")) recordLoginTime();

    const handleRouteChange = () => {
      const isDashboardRoute = window.location.hash === "#/dashboard";
      setAuthenticated(isDashboardRoute);
      if (isDashboardRoute) setActiveScreen("Dashboard");
    };

    window.addEventListener("hashchange", handleRouteChange);
    return () => window.removeEventListener("hashchange", handleRouteChange);
  }, []);

  return {
    activeScreen,
    appLoading,
    authenticated,
    login,
    logout,
    navigate,
    openSidebar: () => setSidebarOpen(true),
    closeSidebar: () => setSidebarOpen(false),
    sidebarOpen,
  };
}
