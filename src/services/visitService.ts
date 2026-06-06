/**
 * Visit tracking service
 * Records page visits for analytics
 */

/**
 * Record a page visit
 */
export const recordVisit = async (page?: string) => {
  try {
    await fetch(`/api/stats`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "visit",
        data: {
          page:
            page ||
            (typeof window !== "undefined" ? window.location.pathname : "")
        }
      })
    });
  } catch (error) {
    console.warn("Failed to record visit:", error);
  }
};

/**
 * Record an order creation
 */
export const recordOrder = async (orderId: string, amount: number) => {
  try {
    await fetch(`/api/stats`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "order",
        data: { orderId, amount }
      })
    });
  } catch (error) {
    console.warn("Failed to record order:", error);
  }
};

/**
 * Record menu view
 */
export const recordMenuView = async (itemId?: string) => {
  try {
    await fetch(`/api/stats`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "menu_view",
        data: { itemId }
      })
    });
  } catch (error) {
    console.warn("Failed to record menu view:", error);
  }
};

export default {
  recordVisit,
  recordOrder,
  recordMenuView
};
