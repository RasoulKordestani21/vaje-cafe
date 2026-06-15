import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";
import { requireAdminAccess } from "@/lib/adminApiAuth";

// PUT update message (mark as read, add reply)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { admin_read, admin_replied, admin_reply, subject, message } = body;

    const existing = db.prepare("SELECT * FROM customer_messages WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (admin_read !== undefined) {
      updateFields.push("admin_read = ?");
      updateValues.push(admin_read ? 1 : 0);
    }

    if (admin_replied !== undefined) {
      updateFields.push("admin_replied = ?");
      updateValues.push(admin_replied ? 1 : 0);
    }

    if (admin_reply !== undefined) {
      updateFields.push("admin_reply = ?");
      updateValues.push(admin_reply);
    }

    if (subject !== undefined) {
      updateFields.push("subject = ?");
      updateValues.push(subject || null);
    }

    if (message !== undefined) {
      if (!message || !String(message).trim()) {
        return NextResponse.json({ error: "متن پیام نمی‌تواند خالی باشد" }, { status: 400 });
      }
      updateFields.push("message = ?");
      updateValues.push(String(message).trim());
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateFields.push("updatedAt = ?");
    updateValues.push(now);
    updateValues.push(id);

    db.prepare(`
      UPDATE customer_messages
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues);

    const updatedMessage = db.prepare("SELECT * FROM customer_messages WHERE id = ?").get(id) as any;

    return NextResponse.json(
      {
        ...updatedMessage,
        admin_read: Boolean(updatedMessage.admin_read),
        admin_replied: Boolean(updatedMessage.admin_replied),
        createdAt: Number(updatedMessage.createdAt),
        updatedAt: Number(updatedMessage.updatedAt),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Customer message PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAdminAccess(request);
  if (!auth.authorized) return auth.error;

  try {
    const db = getDatabase();
    const { id } = await Promise.resolve(params);

    const existing = db.prepare("SELECT * FROM customer_messages WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    db.prepare("DELETE FROM customer_messages WHERE id = ?").run(id);

    return NextResponse.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Customer message DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete message" },
      { status: 500 }
    );
  }
}



