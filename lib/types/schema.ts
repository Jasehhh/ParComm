export interface ActivityLogRecord {
  qrId: string;
  plate_number: string;
  time_stamp: string;
  date: string;
  status: 'Not Parked' | 'Parked' | 'Exited';
  location: string;
  /** Epoch ms of the park scan; null when the vehicle has not parked. */
  parkedAt: number | null;
  /** Epoch ms of the exit scan; null when the vehicle has not left. */
  exitedAt: number | null;
}

export interface ParkingArea {
  id: string;          
  name: string;        
  occupied: number;    
  capacity: number;    
}

