"use server";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { increment, getDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase for server-side use
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const STATS_COLLECTION = "stats";
const STATS_DOC_ID = "general";

export async function incrementVisitCountServer() {
  try {
    const statsRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      await setDoc(
        statsRef,
        {
          visits: increment(1)
        },
        { merge: true }
      );
    } else {
      await setDoc(statsRef, {
        visits: 1,
        totalSales: 0,
        ordersCount: 0
      });
    }
  } catch (error) {
    console.error("Error incrementing visit count:", error);
  }
}
