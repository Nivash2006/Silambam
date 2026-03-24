import { Student, AttendanceRecord, FeePayment, TournamentRecord, BeltPromotion } from './types';

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Arun Kumar',
    age: 14,
    phone: '9876543210',
    parentPhone: '9876543211',
    address: '123, Main St, Chennai',
    joiningDate: '2023-01-15',
    beltLevel: 'Green',
    feeAmount: 500,
    feeStatus: 'paid',
  },
  {
    id: '2',
    name: 'Priya Dharshini',
    age: 12,
    phone: '9876543212',
    parentPhone: '9876543213',
    address: '45, Park Ave, Chennai',
    joiningDate: '2023-05-20',
    beltLevel: 'Orange',
    feeAmount: 500,
    feeStatus: 'pending',
  },
  {
    id: '3',
    name: 'Sanjay Ram',
    age: 16,
    phone: '9876543214',
    parentPhone: '9876543215',
    address: '89, Lake View, Chennai',
    joiningDate: '2022-11-10',
    beltLevel: 'Brown',
    feeAmount: 600,
    feeStatus: 'paid',
  },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: '1', date: '2024-03-15', studentId: '1', status: 'present' },
  { id: '2', date: '2024-03-15', studentId: '2', status: 'absent' },
  { id: '3', date: '2024-03-15', studentId: '3', status: 'present' },
];

export const MOCK_FEES: FeePayment[] = [
  { id: '1', studentId: '1', amount: 500, date: '2024-03-05', method: 'online', month: 'March 2024' },
  { id: '2', studentId: '3', amount: 600, date: '2024-03-02', method: 'cash', month: 'March 2024' },
];

export const MOCK_TOURNAMENTS: TournamentRecord[] = [
  { id: '1', name: 'State Level Silambam Championship', date: '2024-02-10', studentId: '3', position: '1st' },
  { id: '2', name: 'District Meet 2024', date: '2024-01-25', studentId: '1', position: '2nd' },
];

export const MOCK_PROMOTIONS: BeltPromotion[] = [
  { id: '1', studentId: '1', previousLevel: 'Orange', newLevel: 'Green', date: '2023-12-15' },
];
