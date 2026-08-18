// lib/services/db.ts
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import app from "@/lib/firebase";
import { ActivityLogRecord, ParkingArea } from "@/lib/types/schema";

const db = getFirestore(app);

// Higher-order FOR ACTIVITY RECORD
export const createActivityLog = async (recordData: ActivityLogRecord) => {
  try {
    const logCollection = collection(db, "activity_log");
    
    //timestamp sa server side, ensuring immutability
    const docRef = await addDoc(logCollection, {
      ...recordData,
      timeStamp: serverTimestamp() 
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error writing to database:", error);
    throw error;
  }
};
// for parking view
export const subscribeToParkingAreas = (callback: (areas: ParkingArea[]) => void) => {
  const areasCollection = collection(db, "parking_areas");
  

  const unsubscribe = onSnapshot(areasCollection, (snapshot) => {
    //  will Map the raw Firestore documents into our schema
    const liveAreas = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // We use the Firestore document ID as our primary key
        name: data.name,
        occupied: data.occupied,
        capacity: data.capacity,
        type: data.type
      } as ParkingArea;
    });
    
    // Pass the perfectly formatted array back to the frontend
    callback(liveAreas);
  }, (error) => {
    console.error("Error fetching live parking data:", error);
  });

  // Return the unsubscribe function so React can clean it up
  return unsubscribe;
};