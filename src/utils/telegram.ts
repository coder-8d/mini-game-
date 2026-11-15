/**
 * Telegram Web Apps SDK integration & utility functions
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: TelegramUser;
          query_id?: string;
          auth_date?: number;
          hash?: string;
          start_param?: string;
        };
        version: string;
        platform: string;
        colorScheme: "light" | "dark";
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setText: (text: string) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
      };
    };
  }
}

export const getTelegramWebApp = () => {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const isTelegramWebApp = (): boolean => {
  const tg = getTelegramWebApp();
  return Boolean(tg && tg.initData);
};

export const initTelegramWebApps = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#080910");
      tg.setBackgroundColor("#080910");
    } catch (e) {
      console.warn("Failed to set TG colors:", e);
    }
  }
};

export const getTelegramUser = (): TelegramUser | null => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return null;
};

// Haptic feedback with graceful fallback
export const triggerHaptic = (
  type: "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error" = "light"
) => {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) {
    // Optional web vibration fallback if available
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "success") navigator.vibrate([40, 60, 40]);
      else if (type === "error") navigator.vibrate([80, 50, 80]);
      else navigator.vibrate(25);
    }
    return;
  }

  try {
    if (type === "selection") {
      tg.HapticFeedback.selectionChanged();
    } else if (type === "success" || type === "warning" || type === "error") {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Ignore in browsers that don't support haptics
  }
};

// BackButton controller
let currentBackCallback: (() => void) | null = null;

export const setTelegramBackButton = (onClickCallback: (() => void) | null) => {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) return;

  if (currentBackCallback) {
    tg.BackButton.offClick(currentBackCallback);
    currentBackCallback = null;
  }

  if (onClickCallback) {
    currentBackCallback = onClickCallback;
    tg.BackButton.onClick(currentBackCallback);
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }
};
