export interface Student {
  id: string;
  name: string;
  age: number;
  mothers_name?: string;
  dob?: string;
  class_std?: string;
  student_type?: 'New' | 'Old';
  phone: string;
  parent_phone: string;
  address: string;
  joining_date: string;
  belt_level: BeltLevel;
  fee_amount: number;
  fee_status?: 'paid' | 'pending';
  photo_url?: string;
  tshirt_status?: 'None' | 'Wants' | 'Already Has' | 'Bought (Paid)' | 'Bought (Unpaid)';
  tshirt_size?: string;
  tshirt_total_amount?: number;
  tshirt_amount_paid?: number;
  stick_status?: 'None' | 'Wants' | 'Already Has' | 'Bought (Paid)' | 'Bought (Unpaid)';
  stick_size?: string;
  stick_total_amount?: number;
  stick_amount_paid?: number;
  is_private?: boolean;
  private_slots?: string;
  syllabus_progress?: string;
  remaining_sessions?: number;
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

export interface UpcomingTournament {
  id: string;
  name: string;
  date: string;
  fee_amount: number;
  created_at?: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  student_id: string;
  fee_status: 'paid' | 'pending';
  created_at?: string;
  student?: {
    name: string;
    belt_level: string;
    phone: string;
    tshirt_status: string;
    tshirt_size: string;
  };
}

export interface BeltPromotion {
  id: string;
  student_id: string;
  previous_level: BeltLevel;
  new_level: BeltLevel;
  date: string;
  created_at?: string;
}
