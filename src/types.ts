// User and Authentication Types
export type UserRole = 'admin' | 'employee';
export type EmploymentType = 'full_time' | 'part_time' | 'internship' | 'minijob';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  password?: string; // Only used in mock store
  address?: string;
  birthday?: string; // YYYY-MM-DD format
  employment_type?: EmploymentType;
  email_access?: string; // Email access information
  mattermost_url?: string; // Mattermost login URL
  zoom_link?: string; // Zoom meeting link
  stundenliste_link?: string; // Stundenliste link
}

// Project Types
export interface Project {
  id: string;
  name: string;
  is_active: boolean;
  assigned_user_ids: string[]; // Users assigned to this project
  created_at: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

// Task Types
export type TaskStatus = 'Offen' | 'In Bearbeitung' | 'Erledigt';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  assigned_to_user_id: string | null; // null means "Open" task in pool
  title: string;
  description?: string;
  status: TaskStatus;
  attachments: TaskAttachment[];
  created_at: string;
}

// Time Log Types
export interface TimeLog {
  id: string;
  user_id: string;
  project_id?: string;
  task_id?: string;
  customer_name: string;
  date: string; // YYYY-MM-DD format
  hours: number;
  notes?: string;
  created_at: string;
}

// Absence Types
export type AbsenceType =
  | 'Krankheit'
  | 'Urlaub'
  | 'Homeoffice'
  | 'Schule'
  | 'Sonstiges'
  | 'Unentschuldigt';

export interface Absence {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  reason: string;
  type: AbsenceType;
  created_at: string;
}

// Attendance Status Types
export type AttendanceStatus = 'Anwesend' | 'Entschuldigt' | 'Unentschuldigt' | 'Sonstiges';

export interface DailyAttendance {
  user_id: string;
  date: string;
  status: AttendanceStatus;
}

// Notification Types
export type NotificationType = 'task_assigned' | 'missed_login' | 'info';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}
