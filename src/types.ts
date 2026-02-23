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
  email_login?: string; // Login email for mail client
  email_password?: string; // Login password for mail client
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
  | 'Krank'
  | 'Krankheit'
  | 'Krank und unentschuldigt'
  | 'Urlaub'
  | 'Anwesenheit Homeoffice'
  | 'Homeoffice'
  | 'Schule'
  | 'Arbeitsende'
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
export type AttendanceStatus = 'Anwesenheit' | 'Entschuldigt' | 'Unentschuldigt' | 'Sonstiges';

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

export type UploadCategory =
  | 'Personalfragebogen'
  | 'Urlaub'
  | 'Krankheit'
  | 'Bildungsträger'
  | 'Sonstiges';

export interface DocumentUploadMeta {
  id: string;
  user_id: string;
  category: UploadCategory | string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface DocumentUploadOverview {
  user_id: string;
  full_name: string;
  email: string;
  upload_count: number;
  latest_upload_at: string | null;
  unseen_count?: number;
  has_unseen?: boolean;
}

export type SuggestionCategory = 'Einkaufsliste' | 'Verbesserungsvorschlag' | 'Problem/Kummerkasten' | 'Sonstiges';
export type SuggestionStatus = 'Neu' | 'In Bearbeitung' | 'Erledigt';

export interface SuggestionEntry {
  id: string;
  user_id: string | null;
  full_name?: string | null;
  email?: string | null;
  is_anonymous: boolean;
  message: string | null;
  category: SuggestionCategory | string | null;
  status: SuggestionStatus;
  has_image: boolean;
  image_filename?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingChecklistItem {
  id: string;
  user_id: string;
  item_key: string;
  item_label: string;
  completed: boolean;
  completed_at: string | null;
  updated_at: string;
}

export interface OnboardingOverviewRow {
  user_id: string;
  full_name: string;
  email: string;
  total_items: number;
  completed_items: number;
}

export interface RulesAcceptance {
  accepted: boolean;
  accepted_at: string | null;
}
