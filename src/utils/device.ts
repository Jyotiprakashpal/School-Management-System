type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
  };
};

export type CurrentDeviceInfo = {
  browser: string;
  deviceType: string;
  label: string;
  operatingSystem: string;
};

export function getCurrentDeviceInfo(): CurrentDeviceInfo {
  if (typeof navigator === "undefined") {
    return { browser: "Web browser", deviceType: "Desktop device", label: "Web browser", operatingSystem: "Unknown system" };
  }

  const userAgent = navigator.userAgent;
  const userAgentData = (navigator as NavigatorWithUserAgentData).userAgentData;
  const browser = /Edg\//.test(userAgent) ? "Microsoft Edge"
    : /OPR\/|Opera/.test(userAgent) ? "Opera"
      : /CriOS\//.test(userAgent) ? "Chrome"
        : /Chrome\//.test(userAgent) ? "Google Chrome"
          : /FxiOS\/|Firefox\//.test(userAgent) ? "Mozilla Firefox"
            : /Safari\//.test(userAgent) ? "Safari"
              : "Web browser";

  const platform = userAgentData?.platform ?? "";
  const operatingSystem = /Windows/i.test(platform) || /Windows NT/.test(userAgent) ? "Windows"
    : /Android/.test(userAgent) ? "Android"
      : /iPhone|iPad|iPod/.test(userAgent) ? "iOS"
        : /Mac/i.test(platform) || /Mac OS X/.test(userAgent) ? "macOS"
          : /CrOS/.test(userAgent) ? "ChromeOS"
            : /Linux/.test(userAgent) ? "Linux"
              : platform || "Unknown system";

  const mobile = userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  const deviceType = mobile ? "Mobile device" : "Desktop device";

  return { browser, operatingSystem, deviceType, label: `${browser} on ${operatingSystem}` };
}

export function recordLoginTime() {
  window.sessionStorage.setItem("pal-login-time", new Date().toISOString());
}

export function getLoginTime() {
  const stored = window.sessionStorage.getItem("pal-login-time");
  const loginDate = stored ? new Date(stored) : new Date();
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(loginDate);
}
