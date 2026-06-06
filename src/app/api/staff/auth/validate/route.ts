import { NextRequest, NextResponse } from "next/server";
import { getStaffByToken } from "@/lib/staffAuth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("staff_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const staff = getStaffByToken(token);

    if (!staff) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      staff: {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        email: staff.email,
        role: staff.role,
        branch_id: staff.branch_id,
      },
    });
  } catch (error) {
    console.error("Staff validate error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}



