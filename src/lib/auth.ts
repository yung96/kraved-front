export const AUTH_CHANGE_EVENT = "kraeved-auth-change"

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
  }
}

function isValidStoredToken(raw: string | null): raw is string {
  return !!raw && raw !== "undefined" && raw !== "null"
}

export const auth = {
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),

  setToken: (token: string) => {
    if (typeof window === "undefined") return
    localStorage.setItem("token", token)
    notifyAuthChange()
  },

  clear: () => {
    if (typeof window === "undefined") return
    localStorage.removeItem("token")
    notifyAuthChange()
  },

  isLoggedIn: () => isValidStoredToken(auth.getToken()),

  /** Подписка на вход/выход в этой же вкладке (localStorage сам по себе событий не шлёт). */
  subscribe: (cb: () => void) => {
    if (typeof window === "undefined") return () => {}
    window.addEventListener(AUTH_CHANGE_EVENT, cb)
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, cb)
  },
}
