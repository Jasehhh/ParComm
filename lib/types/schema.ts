export interface ActivityLogRecord {
  qrId: string;
  plate_number: string;
  time_stamp: string;
  /** Local calendar day as YYYY-MM-DD, for date filtering. Empty when unknown. */
  date: string;
  status: 'Not Parked' | 'Parked' | 'Exited';
  location: string;
}

export interface ParkingArea {
  id: string;          
  name: string;        
  occupied: number;    
  capacity: number;    
}

