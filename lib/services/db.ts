
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import app from "@/lib/firebase";
import { ActivityLogRecord, ParkingArea } from "@/lib/types/schema";

const db = getFirestore(app);

export const subscribeToActivityLogs = (callback: (logs: any[]) => void) => {
  const logCollection = collection(db, 'activity_log');
  
  const unsubscribe = onSnapshot(logCollection, (snapshot) => {
    const fetchedLogs = snapshot.docs.map(doc => {
      const data = doc.data();
      
      let formattedTime = "00:00:00";
      if (data.time_stamp && typeof data.time_stamp.toDate === 'function') {
        const dateObj = data.time_stamp.toDate();
        formattedTime = dateObj.toLocaleTimeString('en-US', { hour12: false });
      }

      return {
        id: doc.id.substring(0, 6).toUpperCase(),
        plate: data.plate_number || 'Unknown', 
        time: formattedTime,
        status: data.status || 'Unknown',
        location: data.location || '-' 
      };
    });

    callback(fetchedLogs);
  });

  return unsubscribe;
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


export const createParkingTicket = async (qrId: string, plateNumber: string) => {
  const logCollection = collection(db, "activity_log");
  
  await addDoc(logCollection, {
    qrId: qrId,
    plate_number: plateNumber,
    status: "Active",
    location: "",
    time_stamp: serverTimestamp() 
  });
};