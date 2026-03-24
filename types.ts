export interface Student {
  id: string;
  name: string;
  age: number;
  phone: string;
  parentPhone: string;
  address: string;
  joiningDate: string;
  beltLevel: BeltLevel;
  feeAmount: number;
  feeStatus: 'paid' | 'pending';
  photoUrl?: string;
}

export type BeltLevel = 
  | 'White' 
  | 'Yellow' 
  | 'Orange' 
  | 'Green' 
  | 'Blue' 
  | 'Purple' 
  | 'Brown' 
  | 'Black';

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  status: 'present' | 'absent';
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: 'cash' | 'online';
  month: string;
}

export interface TournamentRecord {
  id: string;
  name: string;
  date: string;
  studentId: string;
  position: '1st' | '2nd' | '3rd' | 'Participation';
}

export interface BeltPromotion {
  id: string;
  studentId: string;
  previousLevel: BeltLevel;
  newLevel: BeltLevel;
  date: string;
}
