"use client";

import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  increment,
  setDoc,
  getDoc
} from "firebase/firestore";
import { MenuItem, Order, OrderItem } from "../types";

/**
 * DB SERVICE LAYER
 * This file acts as the repository. If you migrate to SQLite or Postgres later,
 * you only need to rewrite the functions in this file to query your new DB.
 * The rest of the React application will remain unchanged.
 */

const MENU_COLLECTION = "menu_items";
const ORDERS_COLLECTION = "orders";
const STATS_COLLECTION = "stats";
const STATS_DOC_ID = "general";

// --- MENU OPERATIONS ---

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, MENU_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as MenuItem)
    );
  } catch (error) {
    console.error("Error fetching menu:", error);
    return [];
  }
};

export const subscribeToMenu = (callback: (items: MenuItem[]) => void) => {
  const q = query(collection(db, MENU_COLLECTION));
  return onSnapshot(q, snapshot => {
    const items = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as MenuItem)
    );
    callback(items);
  });
};

export const addMenuItemToDB = async (
  item: Omit<MenuItem, "id">,
  imageFile?: File
): Promise<void> => {
  try {
    let imageUrl = item.imageUrl;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile, "menu-images");
    }

    await addDoc(collection(db, MENU_COLLECTION), { ...item, imageUrl });
  } catch (error) {
    console.error("Error adding item:", error);
    throw error;
  }
};

export const updateMenuItemInDB = async (
  id: string,
  updates: Partial<MenuItem>,
  imageFile?: File
): Promise<void> => {
  try {
    const docRef = doc(db, MENU_COLLECTION, id);
    let finalUpdates = { ...updates };

    if (imageFile) {
      const url = await uploadImage(imageFile, "menu-images");
      finalUpdates.imageUrl = url;
    }

    await updateDoc(docRef, finalUpdates);
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
};

export const deleteMenuItemFromDB = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, MENU_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};

// --- ORDER OPERATIONS ---

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, snapshot => {
    const orders = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as Order)
    );
    callback(orders);
  });
};

export const createOrderInDB = async (
  items: OrderItem[],
  note?: string
): Promise<void> => {
  try {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const order: Omit<Order, "id"> = {
      items,
      totalAmount,
      status: "pending",
      createdAt: Date.now(),
      customerNote: note
    };

    await addDoc(collection(db, ORDERS_COLLECTION), order);

    // Update Sales Stats
    await updateStats("totalSales", totalAmount);
    await updateStats("ordersCount", 1);
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const updateOrderStatusInDB = async (
  id: string,
  status: Order["status"]
): Promise<void> => {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

// --- STATS / ANALYTICS OPERATIONS ---

export const incrementVisitCount = async () => {
  try {
    await updateStats("visits", 1);
  } catch (e) {
    console.error("Failed to track visit", e);
  }
};

// Helper to update global stats safely
const updateStats = async (field: string, value: number) => {
  const statsRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  const docSnap = await getDoc(statsRef);

  if (!docSnap.exists()) {
    // Create if doesn't exist
    await setDoc(statsRef, {
      visits: 0,
      totalSales: 0,
      ordersCount: 0,
      [field]: value
    });
  } else {
    // Atomically increment
    await updateDoc(statsRef, {
      [field]: increment(value)
    });
  }
};

export const getStats = async () => {
  const statsRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  const docSnap = await getDoc(statsRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return { visits: 0, totalSales: 0, ordersCount: 0 };
};
