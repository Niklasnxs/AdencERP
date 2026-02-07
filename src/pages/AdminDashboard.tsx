import { useState, Fragment } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Clock, FolderKanban, Users as UsersIcon, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';

export function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  if (!user || !isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Zugriff verweigert</p>
        </div>
      </div>
    );
  }

  const allUsers = store.getUsers();
  const allProjects = store.getProjects();
  const allTasks = store.getTasks();
  const allTimeLogs = store.getTimeLogs();

  const csvData = useMemo(() => {
    const header = ['Mitarbeiter', 'E-Mail', 'Datum', 'Kunde', 'Projekt', 'Aufgabe', 'Stunden', 'Beschreibung'];
    const rows = allTimeLogs.map(log => {
      const employee = allUsers.find(u => u.id.toString() === log.user_id.toString());
      const project = log.project_id ? store.getProjectById(log.project_id) : undefined;
      const task = log.task_id ? allTasks.find(t => t.id === log.task_id) : undefined;
      return [
        employee?.full_name || 'Unbekannt',
        employee?.email || '',
        format(new Date(log.date), 'dd.MM.yyyy'),
        log.customer_name,
        project?.name || 'Unbekanntes Projekt',
        task?.title || '',
        String(log.hours),
        log.notes || ''
      ];
    });
    return [header, ...rows];
  }, [allTimeLogs, allUsers, allTasks]);

  const handleExportCSV = () => {
    const lines = csvData.map(row => row.map(field => {
      if (field === null || field === undefined) return '';
      const value = String(field).replace(/"/g, '""');
      if (value.includes(';') || value.includes('"') || value.includes('\n')) {
        return `"${value}"`;
      }
      return value;
    }).join(';'));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zeiterfassung_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const employees = allUsers.filter(u => u.role === 'employee');
  
  const employeeStats = employees.map(emp => {
    const empTimeLogs = store.getTimeLogsByUser(emp.id);
    const totalHours = empTimeLogs.reduce((sum, log) => sum + Number(log.hours), 0);
    
    // Group by project
    const projectBreakdown: {
      [key: string]: { 
        project: string; 
        hours: number; 
        tasks: { task: string; hours: number; logs: typeof empTimeLogs }[] 
      }
    } = {};
    
    empTimeLogs.forEach(log => {
      const project = log.project_id ? store.getProjectById(log.project_id) : undefined;
      const projectName = project?.name || 'Unbekanntes Projekt';
      
      const projectKey = log.project_id ? log.project_id.toString() : 'unassigned';

      if (!projectBreakdown[projectKey]) {
        projectBreakdown[projectKey] = {
          project: projectName,
          hours: 0,
          tasks: []
        };
      }
      
      projectBreakdown[projectKey].hours += Number(log.hours);
      
      // Group by task
      if (log.task_id) {
        const task = allTasks.find(t => t.id === log.task_id);
        const taskName = task?.title || 'Unbekannte Aufgabe';
        
        const existingTask = projectBreakdown[projectKey].tasks.find(t => t.task === taskName);
        if (existingTask) {
          existingTask.hours += Number(log.hours);
          existingTask.logs.push(log);
        } else {
          projectBreakdown[projectKey].tasks.push({
            task: taskName,
            hours: Number(log.hours),
            logs: [log]
          });
        }
      }
    });
    
    return {
      employee: emp,
      totalHours,
      projectBreakdown: Object.values(projectBreakdown),
      logs: empTimeLogs
    };
  });

  // Sort by total hours (descending)
  employeeStats.sort((a, b) => b.totalHours - a.totalHours);

  const toggleEmployee = (empId: string) => {
    setExpandedEmployee(expandedEmployee === empId ? null : empId);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Systemübersicht und Zeiterfassung</p>
        <button
          onClick={handleExportCSV}
          className="mt-4 inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Zeiterfassung als CSV exportieren
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Benutzer</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{allUsers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Projekte</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allProjects.filter(p => p.is_active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offene Aufgaben</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allTasks.filter(t => t.status === 'Offen').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamte Stunden</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allTimeLogs.reduce((sum, log) => sum + Number(log.hours), 0)}h
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Employee Time Tracking Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Mitarbeiter Zeiterfassung</h2>
          <p className="text-sm text-gray-600 mt-1">
            Klicken Sie auf einen Mitarbeiter, um detaillierte Informationen zu sehen
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mitarbeiter</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Gesamtstunden</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Projekte</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Einträge</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.map(stat => (
                <Fragment key={stat.employee.id}>
                  <tr
                    onClick={() => toggleEmployee(stat.employee.id)}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                          {stat.employee.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stat.employee.full_name}</p>
                          <p className="text-sm text-gray-500">{stat.employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {stat.totalHours}h
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {stat.projectBreakdown.length}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {stat.logs.length}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {expandedEmployee === stat.employee.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {expandedEmployee === stat.employee.id && (
                    <tr key={`${stat.employee.id}-details`} className="bg-gray-50">
                      <td colSpan={5} className="p-6">
                        <div className="space-y-4">
                          <h3 className="font-bold text-gray-900 mb-4">
                            Detaillierte Zeiterfassung für {stat.employee.full_name}
                          </h3>
                          
                          {stat.projectBreakdown.length === 0 ? (
                            <p className="text-gray-500">Keine Zeiteinträge vorhanden</p>
                          ) : (
                            stat.projectBreakdown.map((project, idx) => (
                              <div key={`${project.project}-${idx}`} className="bg-white rounded-lg p-4 border">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4" />
                                    {project.project}
                                  </h4>
                                  <span className="text-lg font-bold text-blue-600">
                                    {project.hours}h
                                  </span>
                                </div>
                                
                                {project.tasks.length > 0 && (
                                  <div className="ml-6 space-y-2">
                                    {project.tasks.map((task, taskIdx) => (
                                      <div key={`${task.task}-${taskIdx}`} className="flex items-start justify-between py-2 border-b last:border-0">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800">{task.task}</p>
                                          <div className="mt-1 space-y-1">
                                            {task.logs.map((log) => (
                                              <p key={log.id} className="text-xs text-gray-500">
                                                {format(new Date(log.date), 'dd.MM.yyyy')} - {log.hours}h
                                                {log.notes && `: ${log.notes}`}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                        <span className="ml-4 font-semibold text-gray-700">
                                          {task.hours}h
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
