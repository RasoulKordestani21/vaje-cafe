"use server";

import { cookies } from "next/headers";

export async function incrementVisitCountServer() {
  try {
    // Use relative path and make fetch with proper headers
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

    const response = await fetch(`${baseUrl}/api/stats`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "visit",
        data: { page: "home" }
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      console.error("Failed to record visit:", response.statusText);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Error incrementing visit count:", error);
    return { success: false, error };
  }
}
