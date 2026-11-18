import { useEffect, useState } from "react";
import { recordLoginTime } from "../utils/device";
import { get, getToken, post } from "../api/methods";
import { API_BASE, API_ENDPOINTS } from "../api/endpoints";
import { clearAuthSession, getAuthUser, storeAuthUser, type AuthUser } from "../auth/session";
import { onSessionTerminated } from "../api/socket";

export function useAppController() {
  const [activeScreen, setActiveScreen] = useState("Dashboard");
  const [appLoading, setAppLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()) && window.location.hash === "#/dashboard");

  const login = (user: AuthUser) => {
    storeAuthUser(user, Boolean(window.localStorage.getItem("pal-auth-token")));
    recordLoginTime();
    setAuthenticated(true);
    setActiveScreen("Dashboard");
    setAppLoading(true);
    window.location.hash = "/dashboard";
    window.setTimeout(() => setAppLoading(false), 1400);
  };

  const logout = () => {
    // Clear the server-side session as well as the browser credentials. Do
    // this before clearing the token so the request includes authentication.
    if (getToken()) {
      void post(`${API_BASE}${API_ENDPOINTS.USER}/sessions/current/terminate`).catch(() => undefined);
    }
    window.sessionStorage.removeItem("pal-login-time");
    clearAuthSession();
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
    if (window.location.hash === "#/dashboard" && getToken() && !getAuthUser()) {
      clearAuthSession();
      window.location.hash = "/login";
      return;
    }
    if (window.location.hash === "#/dashboard" && getToken() && !window.sessionStorage.getItem("pal-login-time")) recordLoginTime();

    const handleRouteChange = () => {
      const isDashboardRoute = window.location.hash === "#/dashboard";
      setAuthenticated(isDashboardRoute && Boolean(getToken()) && Boolean(getAuthUser()));
      if (isDashboardRoute) setActiveScreen("Dashboard");
    };

    window.addEventListener("hashchange", handleRouteChange);
    return () => window.removeEventListener("hashchange", handleRouteChange);
  }, []);

  useEffect(() => onSessionTerminated(({ token }) => {
    if (getToken() === token) logout();
  }), []);

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    let timeoutId: number | undefined;
    const loadSessionTimeout = async () => {
      try {
        const settings = await get<{ sessionTimeout?: number }>(`${API_BASE}${API_ENDPOINTS.SETTINGS}`);
        if (cancelled) return;
        const timeoutMinutes = Number(settings.sessionTimeout) || 30;
        timeoutId = window.setTimeout(logout, timeoutMinutes * 60 * 1000);
      } catch {
        timeoutId = window.setTimeout(logout, 30 * 60 * 1000);
      }
    };
    void loadSessionTimeout();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [authenticated]);

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
