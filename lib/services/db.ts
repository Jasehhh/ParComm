
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, where, doc, increment, updateDoc, getDoc, getDocs, orderBy, Timestamp } from "firebase/firestore";
import app from "@/lib/firebase";
import { ActivityLogRecord, ParkingArea } from "@/lib/types/schema";

const db = getFirestore(app);


//activity logs
export const subscribeToActivityLogs = (callback: (logs: ActivityLogRecord[]) => void) => {
  const logCollection = collection(db, 'activity_log');
  
  const q = query(logCollection, orderBy("time_stamp", "desc"));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const fetchedLogs = snapshot.docs.map(doc => {
      const data = doc.data();
      
      let formattedTime = "00:00:00";
      let calendarDay = "";
      if (data.time_stamp && typeof data.time_stamp.toDate === 'function') {
        const dateObj = data.time_stamp.toDate();
        formattedTime = dateObj.toLocaleTimeString('en-US', { hour12: false });
        // en-CA renders as YYYY-MM-DD
        calendarDay = dateObj.toLocaleDateString('en-CA');
      }
      return {
        qrId: data.qrId || doc.id.substring(0, 6).toUpperCase(),
        plate_number: data.plate_number || 'Unknown',
        time_stamp: formattedTime,
        date: calendarDay,
        status: data.status === 'Active' ? 'Not Parked' : (data.status || 'Not Parked'),
        location: data.location || '-'
      } as ActivityLogRecord;
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
        id: doc.id, 
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

//making parking ticket
export const createParkingTicket = async (qrId: string, plateNumber: string) => {
  const ticketCollection = collection(db, "tickets");
  const expiresAt = Timestamp.fromMillis(Date.now() + 12 * 60 * 60 * 1000);

  await addDoc(ticketCollection, {
    qrId: qrId,
    plate_number: plateNumber,
    status: "Not Parked",
    location: "",
    time_stamp: serverTimestamp(),
    expiresAt
  });

  // Mirror the ticket into the admin feed straight away, so a QR that has been
  // issued but not yet scanned is visible as "Not Parked". This row is then
  // updated in place on park and on exit — one row per ticket, never appended.
  await addDoc(collection(db, "activity_log"), {
    qrId: qrId,
    plate_number: plateNumber,
    status: "Not Parked",
    location: "",
    time_stamp: serverTimestamp()
  });
};

export const processTicketScan = async (
  ticketId: string,
  locationId: string,
  action: "Parked" | "Exited"
) => {
  const ticketsRef = collection(db, "tickets");
  const q = query(ticketsRef, where("qrId", "==", ticketId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Invalid QR Code: Ticket not found.");
  }

  const ticketDoc = querySnapshot.docs[0];
  const ticketData = ticketDoc.data();
  const currentStatus = ticketData.status;
  const plateNumber = ticketData.plate_number;

  if (ticketData.expiresAt?.toMillis && ticketData.expiresAt.toMillis() <= Date.now()) {
    throw new Error("This QR ticket has expired. Generate a new ticket.");
  }
  
  // Fallback in case location isn't set on the ticket yet
  const ticketLocation = ticketData.location || locationId;

  // STRICT SAFETY CHECKS (Must happen BEFORE any database updates)
  
  // Prevent double-parking with smart location awareness
  if (action === "Parked" && currentStatus === "Parked") {
    if (ticketLocation === locationId) {
      throw new Error(`Vehicle ${plateNumber} is already parked here.`);
    } else {
      throw new Error(`Vehicle ${plateNumber} is already parked at ${ticketLocation}.`);
    }
  }
  
  // Prevent exiting a car that isn't parked
  if (action === "Exited" && currentStatus !== "Parked") {
    throw new Error(`Vehicle ${plateNumber} cannot exit (Status: ${currentStatus}).`);
  }

  // Prevent exceeding capacity
  const areaRef = doc(db, "parking_areas", locationId);
  if (action === "Parked") {
    const areaSnap = await getDoc(areaRef);
    if (areaSnap.exists()) {
      const areaData = areaSnap.data();
      if (areaData.occupied >= areaData.capacity) {
        throw new Error(`Scan blocked: ${areaData.name} is completely full (${areaData.capacity}/${areaData.capacity}).`);
      }
    }
  }

  // EXECUTE THE UPDATES 
  
  // A. Update the ticket itself (Save the location if parking IN)
  if (action === "Parked") {
    await updateDoc(ticketDoc.ref, { status: action, location: locationId });
  } else {
    await updateDoc(ticketDoc.ref, { status: action });
  }

  // B. Update or Create the activity_log for the Admin Dashboard
  const logCollection = collection(db, "activity_log");
  
  if (action === "Parked") {
    // Car is arriving -> update this ticket's existing row (created when the QR
    // was generated). Tickets issued before that behaviour existed have no row,
    // so fall back to appending one.
    const qLog = query(logCollection, where("qrId", "==", ticketId));
    const logSnap = await getDocs(qLog);

    if (!logSnap.empty) {
      await updateDoc(logSnap.docs[0].ref, {
        plate_number: plateNumber,
        status: action,
        location: locationId,
        time_stamp: serverTimestamp()
      });
    } else {
      await addDoc(logCollection, {
        qrId: ticketId,
        plate_number: plateNumber,
        status: action,
        location: locationId,
        time_stamp: serverTimestamp()
      });
    }
  } else if (action === "Exited") {
    // Car is leaving -> Find their active row and update it
    const qLog = query(logCollection, where("qrId", "==", ticketId), where("status", "==", "Parked"));
    const logSnap = await getDocs(qLog);
    
    if (!logSnap.empty) {
      const logDoc = logSnap.docs[0];
      await updateDoc(logDoc.ref, {
        status: "Exited",
        time_stamp: serverTimestamp()
      });
    }
  }

  // Update the parking_areas capacity gauge (+1 if parked, -1 if exited)
  const capacityChange = action === "Parked" ? 1 : -1;
  await updateDoc(areaRef, {
    occupied: increment(capacityChange)
  });

  return { plateNumber, newStatus: action };
};