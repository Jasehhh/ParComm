export interface ActivityLogRecord {
  qrId: string; //primary key
  plate_number: string;
  status: 'Parked' | 'Exited';
  location: string;
}

export interface ParkingArea {
  id: string;          
  name: string;        
  occupied: number;    
  capacity: number;    
}

