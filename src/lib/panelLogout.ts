/** Clears admin + staff sessions on the server (cookies + DB). */
export async function logoutPanelSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Panel logout API error:", err);
  }
}
