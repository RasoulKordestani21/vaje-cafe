import { NextRequest, NextResponse } from "next/server";
import { getStaffByToken } from "./staffAuth";

export interface StaffAuthResult {
  authenticated: boolean;
  staff: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    role: "waiter" | "barista" | "manager";
    branch_id: string | null;
  } | null;
}

export async function verifyStaffAuth(
  request: NextRequest
): Promise<StaffAuthResult> {
  const token = request.cookies.get("staff_token")?.value;

  if (!token) {
    return { authenticated: false, staff: null };
  }

  const staff = getStaffByToken(token);

  if (!staff) {
    return { authenticated: false, staff: null };
  }

  return {
    authenticated: true,
    staff: {
      id: staff.id,
      name: staff.name,
      phone: staff.phone,
      email: staff.email,
      role: staff.role,
      branch_id: staff.branch_id,
    },
  };
}

export function ensureStaff(
  request: NextRequest,
  allowedRoles?: ("waiter" | "barista" | "manager")[]
): NextResponse | null {
  const token = request.cookies.get("staff_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = getStaffByToken(token);

  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(staff.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return null; // Authorized
}



