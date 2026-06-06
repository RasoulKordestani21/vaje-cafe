import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerBySession } from "@/lib/customerAuthService";
import { getDatabase } from "@/lib/database";
import { compressAndSaveImage, deleteImage, validateImage } from "@/lib/imageService";

const CUSTOMER_COOKIE_NAME = "customer_auth_token";

// POST upload profile picture
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است" },
        { status: 401 }
      );
    }

    const customer = getCustomerBySession(token);
    if (!customer) {
      return NextResponse.json(
        { error: "جلسه منقضی شده است" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "فایل تصویری ارسال نشده است" },
        { status: 400 }
      );
    }

    // Validate file
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    validateImage(buffer, imageFile.type);

    // Get existing profile picture to delete later
    const db = getDatabase();
    const existingCustomer = db
      .prepare("SELECT profilePicture FROM customers WHERE id = ?")
      .get(customer.id) as any;

    // Compress and save image
    const { fileName, url } = await compressAndSaveImage(buffer, imageFile.name, {
      width: 400,
      height: 400,
      quality: 85
    });

    // Update customer profile picture
    db.prepare(
      `UPDATE customers SET profilePicture = ?, updatedAt = ? WHERE id = ?`
    ).run(url, Math.floor(Date.now() / 1000), customer.id);

    // Delete old profile picture if exists
    if (existingCustomer?.profilePicture) {
      const oldFileName = existingCustomer.profilePicture.split("/").pop();
      if (oldFileName) {
        deleteImage(oldFileName);
      }
    }

    return NextResponse.json({
      profilePicture: url
    });
  } catch (error: any) {
    console.error("Profile picture upload error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// DELETE profile picture
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "احراز هویت نامعتبر است" },
        { status: 401 }
      );
    }

    const customer = getCustomerBySession(token);
    if (!customer) {
      return NextResponse.json(
        { error: "جلسه منقضی شده است" },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const existingCustomer = db
      .prepare("SELECT profilePicture FROM customers WHERE id = ?")
      .get(customer.id) as any;

    if (existingCustomer?.profilePicture) {
      // Delete image file
      const fileName = existingCustomer.profilePicture.split("/").pop();
      if (fileName) {
        deleteImage(fileName);
      }

      // Update database
      db.prepare(
        `UPDATE customers SET profilePicture = NULL, updatedAt = ? WHERE id = ?`
      ).run(Math.floor(Date.now() / 1000), customer.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile picture delete error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
