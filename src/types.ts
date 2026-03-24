export interface Student {
  id: string;
  name: string;
  age: number;
  phone: string;
  parent_phone: string;
  address: string;
  joining_date: string;
  belt_level: BeltLevel;
  fee_amount: number;
  fee_status?: 'paid' | 'pending';
  photo_url?: string;
  created_at?: string;
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
  student_id: string;
  status: 'present' | 'absent';
  class_type?: string;
  created_at?: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  method: 'cash' | 'online';
  status: 'paid' | 'pending';
  month: string;
  created_at?: string;
}

export interface TournamentRecord {
  id: string;
  name: string;
  date: string;
  student_id: string;
  position: '1st' | '2nd' | '3rd' | 'Participation';
  created_at?: string;
}

export interface BeltPromotion {
  id: string;
  student_id: string;
  previous_level: BeltLevel;
  new_level: BeltLevel;
  date: string;
  created_at?: string;
}
