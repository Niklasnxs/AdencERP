import type { User, Project, Task, TimeLog, Absence, Notification, AttendanceStatus, DailyAttendance, Customer } from './types';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { 
  usersAPI, 
  projectsAPI, 
  tasksAPI, 
  timeLogsAPI, 
  absencesAPI,
  customersAPI
} from './services/api';

// Data store using PostgreSQL API
class DataStore {
  // Cache for frequently accessed data (refreshed on each page load)
  private cachedUsers: User[] = [];
  private cachedProjects: Project[] = [];
  private cachedCustomers: Customer[] = [];
  private cachedTasks: Task[] = [];
  private cachedTimeLogs: TimeLog[] = [];
  private cachedAbsences: Absence[] = [];

  // User methods - synchronous with background refresh
  getUsers(): User[] {
    // Refresh in background
    usersAPI.getAll().then(users => {
      this.cachedUsers = users;
    }).catch(console.error);
    
    return this.cachedUsers.map(u => ({ ...u, password: undefined }));
  }

  getUserById(id: string): User | undefined {
    const user = this.cachedUsers.find(u => u.id.toString() === id.toString());
    return user ? { ...user, password: undefined } : undefined;
  }

  authenticateUser(_email: string, _password: string): User | null {
    // Authentication is now handled by AuthContext with JWT
    return null;
  }

  async createUser(userData: Omit<User, 'id'> & { password: string }): Promise<User> {
    try {
      const newUser = await usersAPI.create(userData);
      this.cachedUsers.push(newUser);
      return { ...newUser, password: undefined };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User> & { password?: string }): Promise<User | null> {
    try {
      const updatedUser = await usersAPI.update(id, updates);
      const index = this.cachedUsers.findIndex(u => u.id.toString() === id.toString());
      if (index !== -1) {
        this.cachedUsers[index] = updatedUser;
      }
      return { ...updatedUser, password: undefined };
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await usersAPI.delete(id);
      this.cachedUsers = this.cachedUsers.filter(u => u.id.toString() !== id.toString());
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Project methods - synchronous with background refresh
  getProjects(): Project[] {
    // Refresh in background
    projectsAPI.getAll().then(projects => {
      this.cachedProjects = projects;
    }).catch(console.error);
    
    return this.cachedProjects;
  }

  // Customer methods - synchronous with background refresh
  getCustomers(): Customer[] {
    customersAPI.getAll().then(customers => {
      this.cachedCustomers = customers;
    }).catch(console.error);

    return this.cachedCustomers;
  }

  getActiveCustomers(): Customer[] {
    return this.cachedCustomers.filter(c => c.is_active);
  }

  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    try {
      const newCustomer = await customersAPI.create(customerData);
      this.cachedCustomers.push(newCustomer);
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const updatedCustomer = await customersAPI.update(id, updates);
      const index = this.cachedCustomers.findIndex(c => c.id.toString() === id.toString());
      if (index !== -1) {
        this.cachedCustomers[index] = updatedCustomer;
      }
      return updatedCustomer;
    } catch (error) {
      console.error('Error updating customer:', error);
      return null;
    }
  }

  getActiveProjects(): Project[] {
    return this.cachedProjects.filter(p => p.is_active);
  }

  getProjectById(id?: string | null): Project | undefined {
    if (id === undefined || id === null) return undefined;
    return this.cachedProjects.find(p => p.id.toString() === id.toString());
  }

  async createProject(projectData: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    try {
      const newProject = await projectsAPI.create(projectData);
      this.cachedProjects.push(newProject);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    try {
      const updatedProject = await projectsAPI.update(id, updates);
      const index = this.cachedProjects.findIndex(p => p.id.toString() === id.toString());
      if (index !== -1) {
        this.cachedProjects[index] = updatedProject;
      }
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      return null;
    }
  }

  // Task methods - synchronous with background refresh
  getTasks(): Task[] {
    // Refresh in background
    tasksAPI.getAll().then(tasks => {
      this.cachedTasks = tasks;
    }).catch(console.error);
    
    return this.cachedTasks;
  }

  getTasksByProject(projectId?: string | null): Task[] {
    if (projectId === undefined || projectId === null) return [];
    return this.cachedTasks.filter(t => t.project_id.toString() === projectId.toString());
  }

  getTasksByUser(userId: string): Task[] {
    return this.cachedTasks.filter(t => t.assigned_to_user_id?.toString() === userId.toString());
  }

  getOpenTasks(userId: string): Task[] {
    const userProjects = this.cachedTasks
      .filter(t => t.assigned_to_user_id?.toString() === userId.toString())
      .map(t => t.project_id);
    
    return this.cachedTasks.filter(
      t => t.assigned_to_user_id === null && userProjects.includes(t.project_id)
    );
  }

  getAllOpenTasks(): Task[] {
    return this.cachedTasks.filter(t => t.assigned_to_user_id === null);
  }

  async createTask(taskData: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    try {
      const newTask = await tasksAPI.create(taskData);
      this.cachedTasks.push(newTask);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const updatedTask = await tasksAPI.update(id, updates);
      const index = this.cachedTasks.findIndex(t => t.id.toString() === id.toString());
      if (index !== -1) {
        this.cachedTasks[index] = updatedTask;
      }
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  async claimTask(taskId: string, userId: string): Promise<Task | null> {
    return this.updateTask(taskId, {
      assigned_to_user_id: userId,
      status: 'In Bearbeitung',
    });
  }

  // Time Log methods - synchronous with background refresh
  getTimeLogs(): TimeLog[] {
    // Refresh in background
    timeLogsAPI.getAll().then(timeLogs => {
      this.cachedTimeLogs = timeLogs;
    }).catch(console.error);
    
    return this.cachedTimeLogs;
  }

  getTimeLogsByUser(userId: string): TimeLog[] {
    return this.cachedTimeLogs.filter(tl => tl.user_id.toString() === userId.toString());
  }

  getTimeLogsByDate(date: string): TimeLog[] {
    return this.cachedTimeLogs.filter(tl => tl.date === date);
  }

  getTimeLogsByUserAndDate(userId: string, date: string): TimeLog[] {
    return this.cachedTimeLogs.filter(
      tl => tl.user_id.toString() === userId.toString() && tl.date === date
    );
  }

  async createTimeLog(timeLogData: Omit<TimeLog, 'id' | 'created_at'>): Promise<TimeLog> {
    try {
      const newTimeLog = await timeLogsAPI.create(timeLogData);
      this.cachedTimeLogs.push(newTimeLog);
      return newTimeLog;
    } catch (error) {
      console.error('Error creating time log:', error);
      throw error;
    }
  }

  async updateTimeLog(id: string, updates: Partial<TimeLog>): Promise<TimeLog | null> {
    try {
      const updatedTimeLog = await timeLogsAPI.update(id, updates);
      const index = this.cachedTimeLogs.findIndex(tl => tl.id.toString() === id.toString());
      if (index !== -1) {
        this.cachedTimeLogs[index] = updatedTimeLog;
      }
      return updatedTimeLog;
    } catch (error) {
      console.error('Error updating time log:', error);
      return null;
    }
  }

  async deleteTimeLog(id: string): Promise<boolean> {
    try {
      await timeLogsAPI.delete(id);
      this.cachedTimeLogs = this.cachedTimeLogs.filter(tl => tl.id.toString() !== id.toString());
      return true;
    } catch (error) {
      console.error('Error deleting time log:', error);
      return false;
    }
  }

  // Absence methods - synchronous with background refresh
  getAbsences(): Absence[] {
    // Refresh in background
    absencesAPI.getAll().then(absences => {
      this.cachedAbsences = absences;
    }).catch(console.error);
    
    return this.cachedAbsences;
  }

  getAbsencesByUser(userId: string): Absence[] {
    return this.cachedAbsences.filter(a => a.user_id.toString() === userId.toString());
  }

  getAbsenceByUserAndDate(userId: string, date: string): Absence | undefined {
    return this.cachedAbsences.find(
      a => a.user_id.toString() === userId.toString() && a.date === date
    );
  }

  async createAbsence(absenceData: Omit<Absence, 'id' | 'created_at'>): Promise<Absence> {
    try {
      const newAbsence = await absencesAPI.create(absenceData);
      this.cachedAbsences.push(newAbsence);
      return newAbsence;
    } catch (error) {
      console.error('Error creating absence:', error);
      throw error;
    }
  }

  async updateAbsence(id: string, updates: Partial<Absence>): Promise<Absence | null> {
    try {
      const updatedAbsence = await absencesAPI.update(id, updates);
      const index = this.cachedAbsences.findIndex(a => a.id.toString() === id.toString());
      if (index !== -1) {
        this.cachedAbsences[index] = updatedAbsence;
      }
      return updatedAbsence;
    } catch (error) {
      console.error('Error updating absence:', error);
      return null;
    }
  }

  async deleteAbsence(id: string): Promise<boolean> {
    try {
      await absencesAPI.delete(id);
      this.cachedAbsences = this.cachedAbsences.filter(a => a.id.toString() !== id.toString());
      return true;
    } catch (error) {
      console.error('Error deleting absence:', error);
      return false;
    }
  }

  async deleteAbsencesByUserAndDate(userId: string, date: string): Promise<boolean> {
    try {
      await absencesAPI.deleteByUserAndDate(userId, date);
      this.cachedAbsences = this.cachedAbsences.filter(
        a => !(a.user_id.toString() === userId.toString() && a.date === date)
      );
      return true;
    } catch (error) {
      console.error('Error deleting absences:', error);
      return false;
    }
  }

  // Notification methods (kept for compatibility, but not heavily used)
  getNotificationsByUser(_userId: string): Notification[] {
    return [];
  }

  createNotification(notificationData: Omit<Notification, 'id' | 'read' | 'created_at'>): Notification {
    return {
      id: Date.now().toString(),
      ...notificationData,
      read: false,
      created_at: new Date().toISOString(),
    };
  }

  markNotificationAsRead(_id: string): boolean {
    return true;
  }

  // Attendance calculation
  calculateAttendanceStatus(userId: string, date: string): AttendanceStatus {
    const hasTimeLog = this.cachedTimeLogs.some(
      tl => tl.user_id.toString() === userId.toString() && tl.date === date
    );
    if (hasTimeLog) return 'Anwesend';

    const absence = this.cachedAbsences.find(
      a => a.user_id.toString() === userId.toString() && a.date === date
    );
    if (absence) {
      return absence.type === 'Unentschuldigt' ? 'Unentschuldigt' : 'Entschuldigt';
    }

    const targetDate = startOfDay(parseISO(date));
    const today = startOfDay(new Date());
    if (isBefore(targetDate, today)) {
      return 'Unentschuldigt';
    }

    return 'Anwesend';
  }

  getAttendanceForPeriod(startDate: string, endDate: string): DailyAttendance[] {
    const attendance: DailyAttendance[] = [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    // Include ALL users, not just employees (admins can also have absences)
    const allUsers = this.cachedUsers;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = format(date, 'yyyy-MM-dd');
      allUsers.forEach(user => {
        attendance.push({
          user_id: user.id,
          date: dateStr,
          status: this.calculateAttendanceStatus(user.id, dateStr),
        });
      });
    }
    
    return attendance;
  }

  // Initialize cache on app start
  async initialize() {
    try {
      await Promise.all([
        this.getUsers(),
        this.getProjects(),
        this.getCustomers(),
        this.getTasks(),
        this.getTimeLogs(),
        this.getAbsences(),
      ]);
      console.log('✅ Store initialized with API data');
    } catch (error) {
      console.error('❌ Error initializing store:', error);
    }
  }
}

export const store = new DataStore();

// Initialize store when module loads
store.initialize();
