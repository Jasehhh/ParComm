export interface ActivityLogRecord {
  qrId: string;
  plate_number: string;
  time_stamp: string;
  status: 'Not Parked' | 'Parked' | 'Exited';
  location: string;
}

export interface ParkingArea {
  id: string;          
  name: string;        
  occupied: number;    
  capacity: number;    
}

