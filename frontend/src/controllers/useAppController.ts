import { useEffect, useRef, useState } from "react";
import { recordLoginTime } from "../utils/device";
import { getToken, post } from "../api/methods";
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
    const idleTimeoutMs = 15 * 60 * 1000;
    const heartbeatIntervalMs = 30 * 1000;
    const lastActivityRef = { current: Date.now() };
    const lastHeartbeatRef = { current: 0 };
    let checking = false;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const sendHeartbeat = async () => {
      if (checking || !getToken()) return;
      checking = true;
      try {
        const response = await fetch(`${API_BASE}${API_ENDPOINTS.SESSION_HEARTBEAT}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!response.ok) logout();
        else lastHeartbeatRef.current = Date.now();
      } catch {
        // A temporary network failure should not log out an active user.
      } finally {
        checking = false;
      }
    };

    const checkIdle = () => {
      const now = Date.now();
      if (now - lastActivityRef.current >= idleTimeoutMs) {
        logout();
        return;
      }
      if (now - lastHeartbeatRef.current >= heartbeatIntervalMs) void sendHeartbeat();
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    const activityTimer = window.setInterval(checkIdle, 15 * 1000);
    void sendHeartbeat();

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(activityTimer);
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
