const STAFF_KEYS = ["staff_data", "staff_auth"] as const;
const ADMIN_KEYS = [
  "vaje_auth",
  "vaje_role",
  "vaje_userType",
  "vaje_admin_token"
] as const;

export type AdminPanelRole = "admin" | "super_admin";

export function clearStaffSessionStorage() {
  if (typeof window === "undefined") return;
  for (const key of STAFF_KEYS) sessionStorage.removeItem(key);
}

export function clearAdminSessionStorage() {
  if (typeof window === "undefined") return;
  for (const key of ADMIN_KEYS) sessionStorage.removeItem(key);
}

export function clearAllPanelSessionStorage() {
  clearStaffSessionStorage();
  clearAdminSessionStorage();
}

export function persistAdminSession(role: AdminPanelRole) {
  if (typeof window === "undefined") return;
  clearStaffSessionStorage();
  sessionStorage.setItem("vaje_auth", "true");
  sessionStorage.setItem("vaje_role", role);
  sessionStorage.setItem("vaje_userType", "admin");
}

export function persistStaffSession(
  staff: Record<string, unknown>,
  role: string
) {
  if (typeof window === "undefined") return;
  clearAllPanelSessionStorage();
  sessionStorage.setItem("vaje_auth", "true");
  sessionStorage.setItem("vaje_role", role);
  sessionStorage.setItem("vaje_userType", "staff");
  sessionStorage.setItem("staff_auth", "true");
  sessionStorage.setItem("staff_data", JSON.stringify(staff));
}

export function getPanelUserType(): "admin" | "staff" | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem("vaje_userType");
  return value === "admin" || value === "staff" ? value : null;
}

export function isAdminPanelRole(role: string | null | undefined): role is AdminPanelRole {
  return role === "admin" || role === "super_admin";
}
