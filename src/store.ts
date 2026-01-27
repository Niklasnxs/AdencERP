import type { User, Project, Task, TimeLog, Absence, Notification, AttendanceStatus, DailyAttendance } from './types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

// Mock data store (simulates a database)
class DataStore {
  private users: User[] = [
    {
      id: '1',
      email: 'admin@adenc.de',
      password: 'admin123',
      full_name: 'Admin User',
      role: 'admin',
    },
    {
      id: '2',
      email: 'max.mueller@adenc.de',
      password: 'emp123',
      full_name: 'Max Müller',
      role: 'employee',
    },
    {
      id: '3',
      email: 'anna.schmidt@adenc.de',
      password: 'emp123',
      full_name: 'Anna Schmidt',
      role: 'employee',
    },
  ];

  private projects: Project[] = [
    {
      id: '1',
      name: 'Website Redesign',
      is_active: true,
      assigned_user_ids: ['2', '3'], // Max and Anna assigned
      created_at: new Date('2025-01-15').toISOString(),
    },
    {
      id: '2',
      name: 'Mobile App Development',
      is_active: true,
      assigned_user_ids: ['2'], // Only Max assigned
      created_at: new Date('2025-01-20').toISOString(),
    },
  ];

  private tasks: Task[] = [
    {
      id: '1',
      project_id: '1',
      assigned_to_user_id: '2',
      title: 'Homepage Design erstellen',
      description: 'Neues Design für die Startseite',
      status: 'In Bearbeitung',
      attachments: [],
      created_at: new Date('2025-01-15').toISOString(),
    },
    {
      id: '2',
      project_id: '1',
      assigned_to_user_id: null, // Open task
      title: 'SEO Optimierung',
      description: 'Meta-Tags und Keywords optimieren',
      status: 'Offen',
      attachments: [],
      created_at: new Date('2025-01-16').toISOString(),
    },
    {
      id: '3',
      project_id: '2',
      assigned_to_user_id: '3',
      title: 'Login Screen Implementation',
      status: 'In Bearbeitung',
      attachments: [],
      created_at: new Date('2025-01-20').toISOString(),
    },
    {
      id: '4',
      project_id: '2',
      assigned_to_user_id: null,
      title: 'API Integration',
      description: 'REST API einbinden',
      status: 'Offen',
      attachments: [],
      created_at: new Date('2025-01-21').toISOString(),
    },
  ];

  private timeLogs: TimeLog[] = [
    {
      id: '1',
      user_id: '2',
      project_id: '1',
      task_id: '1',
      date: format(new Date(), 'yyyy-MM-dd'),
      hours: 6,
      notes: 'Design-Konzept erstellt',
      created_at: new Date().toISOString(),
    },
  ];

  private absences: Absence[] = [];

  private notifications: Notification[] = [];

  // User methods
  getUsers(): User[] {
    return this.users.map(u => ({ ...u, password: undefined }));
  }

  getUserById(id: string): User | undefined {
    const user = this.users.find(u => u.id === id);
    return user ? { ...user, password: undefined } : undefined;
  }

  authenticateUser(email: string, password: string): User | null {
    const user = this.users.find(u => u.email === email && u.password === password);
    return user ? { ...user, password: undefined } : null;
  }

  createUser(userData: Omit<User, 'id'> & { password: string }): User {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };
    this.users.push(newUser);
    return { ...newUser, password: undefined };
  }

  // Project methods
  getProjects(): Project[] {
    return this.projects;
  }

  getActiveProjects(): Project[] {
    return this.projects.filter(p => p.is_active);
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  createProject(projectData: Omit<Project, 'id' | 'created_at'>): Project {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    this.projects.push(newProject);
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.projects[index] = { ...this.projects[index], ...updates };
    return this.projects[index];
  }

  // Task methods
  getTasks(): Task[] {
    return this.tasks;
  }

  getTasksByProject(projectId: string): Task[] {
    return this.tasks.filter(t => t.project_id === projectId);
  }

  getTasksByUser(userId: string): Task[] {
    return this.tasks.filter(t => t.assigned_to_user_id === userId);
  }

  getOpenTasks(userId: string): Task[] {
    // Get tasks from projects the user is involved in
    const userProjects = this.tasks
      .filter(t => t.assigned_to_user_id === userId)
      .map(t => t.project_id);
    
    return this.tasks.filter(
      t => t.assigned_to_user_id === null && userProjects.includes(t.project_id)
    );
  }

  getAllOpenTasks(): Task[] {
    return this.tasks.filter(t => t.assigned_to_user_id === null);
  }

  createTask(taskData: Omit<Task, 'id' | 'created_at'>): Task {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    
    // Trigger notification if assigned
    if (newTask.assigned_to_user_id) {
      this.createNotification({
        user_id: newTask.assigned_to_user_id,
        type: 'task_assigned',
        message: `Neue Aufgabe zugewiesen: ${newTask.title}`,
      });
    }
    
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const oldTask = this.tasks[index];
    this.tasks[index] = { ...oldTask, ...updates };
    
    // Trigger notification if newly assigned
    if (updates.assigned_to_user_id && updates.assigned_to_user_id !== oldTask.assigned_to_user_id) {
      this.createNotification({
        user_id: updates.assigned_to_user_id,
        type: 'task_assigned',
        message: `Neue Aufgabe zugewiesen: ${this.tasks[index].title}`,
      });
    }
    
    return this.tasks[index];
  }

  claimTask(taskId: string, userId: string): Task | null {
    return this.updateTask(taskId, {
      assigned_to_user_id: userId,
      status: 'In Bearbeitung',
    });
  }

  // Time Log methods
  getTimeLogs(): TimeLog[] {
    return this.timeLogs;
  }

  getTimeLogsByUser(userId: string): TimeLog[] {
    return this.timeLogs.filter(tl => tl.user_id === userId);
  }

  getTimeLogsByDate(date: string): TimeLog[] {
    return this.timeLogs.filter(tl => tl.date === date);
  }

  getTimeLogsByUserAndDate(userId: string, date: string): TimeLog[] {
    return this.timeLogs.filter(tl => tl.user_id === userId && tl.date === date);
  }

  createTimeLog(timeLogData: Omit<TimeLog, 'id' | 'created_at'>): TimeLog {
    const newTimeLog: TimeLog = {
      ...timeLogData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    this.timeLogs.push(newTimeLog);
    return newTimeLog;
  }

  updateTimeLog(id: string, updates: Partial<TimeLog>): TimeLog | null {
    const index = this.timeLogs.findIndex(tl => tl.id === id);
    if (index === -1) return null;
    this.timeLogs[index] = { ...this.timeLogs[index], ...updates };
    return this.timeLogs[index];
  }

  deleteTimeLog(id: string): boolean {
    const index = this.timeLogs.findIndex(tl => tl.id === id);
    if (index === -1) return false;
    this.timeLogs.splice(index, 1);
    return true;
  }

  // Absence methods
  getAbsences(): Absence[] {
    return this.absences;
  }

  getAbsencesByUser(userId: string): Absence[] {
    return this.absences.filter(a => a.user_id === userId);
  }

  getAbsenceByUserAndDate(userId: string, date: string): Absence | undefined {
    return this.absences.find(a => a.user_id === userId && a.date === date);
  }

  createAbsence(absenceData: Omit<Absence, 'id' | 'created_at'>): Absence {
    const newAbsence: Absence = {
      ...absenceData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    this.absences.push(newAbsence);
    return newAbsence;
  }

  updateAbsence(id: string, updates: Partial<Absence>): Absence | null {
    const index = this.absences.findIndex(a => a.id === id);
    if (index === -1) return null;
    this.absences[index] = { ...this.absences[index], ...updates };
    return this.absences[index];
  }

  // Notification methods
  getNotificationsByUser(userId: string): Notification[] {
    return this.notifications.filter(n => n.user_id === userId);
  }

  createNotification(notificationData: Omit<Notification, 'id' | 'read' | 'created_at'>): Notification {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;
    notification.read = true;
    return true;
  }

  // Attendance calculation
  calculateAttendanceStatus(userId: string, date: string): AttendanceStatus {
    // Check if there's a time log for this date
    const hasTimeLog = this.timeLogs.some(tl => tl.user_id === userId && tl.date === date);
    if (hasTimeLog) return 'Anwesend';

    // Check if there's an absence notice
    const hasAbsence = this.absences.some(a => a.user_id === userId && a.date === date);
    if (hasAbsence) return 'Entschuldigt';

    // Check if date is in the past
    const targetDate = startOfDay(parseISO(date));
    const today = startOfDay(new Date());
    if (isBefore(targetDate, today)) {
      return 'Unentschuldigt';
    }

    // Future date or today without entry yet
    return 'Anwesend'; // Default for future/current
  }

  getAttendanceForPeriod(startDate: string, endDate: string): DailyAttendance[] {
    const attendance: DailyAttendance[] = [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    const employees = this.users.filter(u => u.role === 'employee');
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = format(date, 'yyyy-MM-dd');
      employees.forEach(emp => {
        attendance.push({
          user_id: emp.id,
          date: dateStr,
          status: this.calculateAttendanceStatus(emp.id, dateStr),
        });
      });
    }
    
    return attendance;
  }
}

export const store = new DataStore();
