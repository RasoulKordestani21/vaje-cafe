import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  getUserByEmail,
  createSession
} from "@/lib/authService";
import { setAuthCookie } from "@/lib/authMiddleware";
import { getDatabase } from "@/lib/database";
import { getStaffByEmail, verifyStaffPassword, createStaffSession } from "@/lib/staffAuth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log("Login attempt for email:", email);

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "فرمت ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    // Try admin login first
    const adminUser = getUserByEmail(email);
    
    if (adminUser) {
      // Verify password
      const isPasswordValid = await verifyPassword(
        password,
        (adminUser as any).password_hash
      );

      if (isPasswordValid) {
        // Create session with cryptographically secure token
        const { token, expiresAt } = createSession((adminUser as any).id);

        // Create response with secure cookie
        const response = NextResponse.json(
          {
            success: true,
            message: "ورود موفق",
            user: {
              id: (adminUser as any).id,
              email: (adminUser as any).email,
              name: (adminUser as any).name
            },
            role: (adminUser as any).role || "admin",
            userType: "admin",
            expiresAt
          },
          { status: 200 }
        );

        // Set secure session cookie
        const finalResponse = setAuthCookie(response, token);
        return finalResponse;
      }
    }

    // Try staff login
    const staff = getStaffByEmail(email);
    
    if (staff) {
      const db = getDatabase();
      const staffWithPassword = db
        .prepare("SELECT * FROM staff WHERE email = ? AND is_active = 1")
        .get(email) as any;

      if (staffWithPassword) {
        const isValid = await verifyStaffPassword(
          password,
          staffWithPassword.password_hash
        );

        if (isValid) {
          const session = createStaffSession(staff.id);

          // Create response
          const response = NextResponse.json(
            {
              success: true,
              message: "ورود موفق",
              user: {
                id: staff.id,
                email: staff.email,
                name: staff.name,
                phone: staff.phone,
                role: staff.role,
                branch_id: staff.branch_id,
              },
              role: staff.role,
              userType: "staff",
              token: session.token,
            },
            { status: 200 }
          );

          // Set staff cookie
          response.cookies.set("staff_token", session.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
          });

          return response;
        }
      }
    }

    // If neither admin nor staff found or password invalid
    return NextResponse.json(
      { error: "ایمیل یا رمز عبور اشتباه است" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "خطای سرور، لطفا دوباره امتحان کنید" },
      { status: 500 }
    );
  }
}
