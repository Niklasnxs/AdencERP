import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Plus, FolderKanban, Users as UsersIcon, Mail, Edit, X } from 'lucide-react';
import type { Project, Task, TaskStatus } from '../types';

export function Projects() {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>(
    isAdmin ? store.getActiveProjects() : store.getActiveProjects().filter(p => p.assigned_user_ids.includes(user!.id))
  );
  const [selectedProject, setSelectedProject] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showEditTaskForm, setShowEditTaskForm] = useState(false);
  const [showAssignTaskForm, setShowAssignTaskForm] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>(store.getTasks());

  if (!user) return null;

  const allUsers = store.getUsers(); // Include all users (admins + employees)
  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || selectedUsers.length === 0) return;

    const newProject = await store.createProject({
      name: newProjectName,
      is_active: true,
      assigned_user_ids: selectedUsers,
    });
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setSelectedUsers([]);
    setShowNewProjectForm(false);
    setSelectedProject(newProject.id);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject) return;

    await store.createTask({
      project_id: selectedProject,
      title: newTaskTitle,
      description: newTaskDesc || undefined,
      assigned_to_user_id: newTaskAssignedTo || null,
      status: newTaskAssignedTo ? 'In Bearbeitung' : 'Offen',
      attachments: [],
    });

    // Send notification to all assigned users in the project
    if (selectedProjectData) {
      selectedProjectData.assigned_user_ids.forEach(userId => {
        store.createNotification({
          user_id: userId,
          type: 'info',
          message: `Neue Aufgabe im Projekt "${selectedProjectData.name}": ${newTaskTitle}`,
        });
      });
    }

    // Get fresh tasks from store to avoid duplicates
    setTasks(store.getTasks());
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskAssignedTo('');
    setShowNewTaskForm(false);
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !newTaskAssignedTo) return;

    await store.updateTask(selectedTaskId, {
      assigned_to_user_id: newTaskAssignedTo,
      status: 'In Bearbeitung',
    });
    setTasks(store.getTasks());
    setShowAssignTaskForm(false);
    setSelectedTaskId(null);
    setNewTaskAssignedTo('');
  };

  const handleClaimTask = async (taskId: string) => {
    await store.claimTask(taskId, user.id);
    // Force component re-render by creating new array reference
    setTasks([...store.getTasks()]);
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    await store.updateTask(taskId, { status });
    setTasks(store.getTasks());
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || '');
    setNewTaskAssignedTo(task.assigned_to_user_id || '');
    setShowEditTaskForm(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !newTaskTitle.trim()) return;

    await store.updateTask(editingTask.id, {
      title: newTaskTitle,
      description: newTaskDesc || undefined,
      assigned_to_user_id: newTaskAssignedTo || null,
      status: newTaskAssignedTo && !editingTask.assigned_to_user_id ? 'In Bearbeitung' : editingTask.status,
    });

    setTasks(store.getTasks());
    setShowEditTaskForm(false);
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskAssignedTo('');
  };

  const projectTasks = selectedProject
    ? tasks.filter(t => t.project_id === selectedProject)
    : [];

  const myTasks = projectTasks.filter(t => t.assigned_to_user_id === user.id);
  const openTasks = projectTasks.filter(t => t.assigned_to_user_id === null);
  const assignedTasks = projectTasks.filter(
    t => t.assigned_to_user_id && t.assigned_to_user_id !== user.id
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projekte</h1>
          <p className="text-gray-600 mt-1">Projektverwaltung und Aufgabenzuweisung</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNewProjectForm(true)}
            className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Neues Projekt
          </button>
        )}
      </div>

      {/* Create Project Modal */}
      {showNewProjectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Neues Projekt erstellen</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projektname *
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="z.B. Website Redesign"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mitarbeiter zuweisen * (mindestens einer)
                </label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, u.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{u.full_name}</span>
                    </label>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedUsers.length} Mitarbeiter ausgewählt
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={selectedUsers.length === 0}
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Erstellen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProjectForm(false);
                    setNewProjectName('');
                    setSelectedUsers([]);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showNewTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Neue Aufgabe erstellen</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aufgabentitel *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="z.B. Homepage Design erstellen"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung (optional)
                </label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Weitere Details zur Aufgabe..."
                  className="w-full px-4 py-2 border rounded-lg h-24"
                />
              </div>

              {isAdmin && selectedProjectData && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zuweisen an (optional)
                  </label>
                  <select
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Nicht zuweisen (im Pool belassen)</option>
                    {allUsers
                      .filter(u => selectedProjectData.assigned_user_ids.includes(u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Alle zugewiesenen Projektmitglieder erhalten eine Benachrichtigung
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Erstellen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTaskForm(false);
                    setNewTaskTitle('');
                    setNewTaskDesc('');
                    setNewTaskAssignedTo('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssignTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Aufgabe zuweisen</h2>
            <form onSubmit={handleAssignTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mitarbeiter auswählen *
                </label>
                <select
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Bitte wählen...</option>
                  {selectedProjectData && allUsers
                    .filter(u => selectedProjectData.assigned_user_ids.includes(u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Zuweisen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignTaskForm(false);
                    setSelectedTaskId(null);
                    setNewTaskAssignedTo('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskForm && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Aufgabe bearbeiten</h2>
            <form onSubmit={handleUpdateTask}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aufgabentitel *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="z.B. Homepage Design erstellen"
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung (optional)
                </label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Weitere Details zur Aufgabe..."
                  className="w-full px-4 py-2 border rounded-lg h-24"
                />
              </div>

              {selectedProjectData && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zugewiesen an
                  </label>
                  <select
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Nicht zugewiesen (Pool)</option>
                    {allUsers
                      .filter(u => selectedProjectData.assigned_user_ids.includes(u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.full_name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTaskForm(false);
                    setEditingTask(null);
                    setNewTaskTitle('');
                    setNewTaskDesc('');
                    setNewTaskAssignedTo('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Projects List */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-bold text-gray-900">Meine Projekte</h2>
            </div>
            <div className="p-2">
              {projects.length === 0 ? (
                <p className="text-gray-500 text-sm p-4">Keine Projekte vorhanden</p>
              ) : (
                projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                      selectedProject === project.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FolderKanban className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{project.name}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                        <UsersIcon className="w-3 h-3" />
                        {project.assigned_user_ids.length}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="col-span-12 lg:col-span-9">
          {selectedProject && selectedProjectData ? (
            <>
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedProjectData.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="w-4 h-4" />
                        {selectedProjectData.assigned_user_ids.length} Mitarbeiter
                      </span>
                      <span>•</span>
                      <span>{projectTasks.length} Aufgaben</span>
                    </div>
                  </div>
                  {(isAdmin || selectedProjectData.assigned_user_ids.includes(user.id)) && (
                    <button
                      onClick={() => setShowNewTaskForm(true)}
                      className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Neue Aufgabe
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* My Tasks - Show for all users (employees and admins) */}
                {myTasks.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b bg-blue-50">
                      <h3 className="font-bold text-gray-900">Meine Aufgaben ({myTasks.length})</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {myTasks.map(task => (
                        <div 
                          key={task.id} 
                          className="p-4 border rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                          onClick={() => {
                            setViewingTask(task);
                            setShowTaskDetailModal(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                task.status === 'Erledigt'
                                  ? 'bg-green-100 text-green-700'
                                  : task.status === 'In Bearbeitung'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Detail Modal for All Users (Employees and Admins) */}
                {showTaskDetailModal && viewingTask && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-lg">
                      <div className="p-6 border-b flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{viewingTask.title}</h2>
                        <button
                          onClick={() => {
                            setShowTaskDetailModal(false);
                            setViewingTask(null);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-6">
                        {viewingTask.description ? (
                          <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-2">Beschreibung</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{viewingTask.description}</p>
                          </div>
                        ) : (
                          <div className="mb-6 text-gray-500 italic">Keine Beschreibung vorhanden</div>
                        )}

                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Aufgabenstatus
                          </label>
                          <select
                            value={viewingTask.status}
                            onChange={(e) => {
                              handleUpdateTaskStatus(viewingTask.id, e.target.value as TaskStatus);
                              const updatedTasks = store.getTasks();
                              const updatedTask = updatedTasks.find(t => t.id === viewingTask.id);
                              if (updatedTask) {
                                setViewingTask(updatedTask);
                              }
                              setTasks(updatedTasks);
                            }}
                            className="w-full px-4 py-3 border-2 rounded-lg text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Offen">Noch nicht angefangen</option>
                            <option value="In Bearbeitung">Daran arbeiten</option>
                            <option value="Erledigt">Fertiggestellt</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-2">
                            Wählen Sie den aktuellen Status Ihrer Arbeit an dieser Aufgabe
                          </p>
                        </div>
                      </div>

                      <div className="p-6 border-t bg-gray-50">
                        <button
                          onClick={() => {
                            setShowTaskDetailModal(false);
                            setViewingTask(null);
                          }}
                          className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Schließen
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Open Tasks (Pool) */}
                {openTasks.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b bg-yellow-50">
                      <h3 className="font-bold text-gray-900">Verfügbare Aufgaben ({openTasks.length})</h3>
                      <p className="text-sm text-gray-600 mt-1">Diese Aufgaben können übernommen werden</p>
                    </div>
                    <div className="p-6 space-y-3">
                      {openTasks.map(task => (
                        <div key={task.id} className="p-4 border rounded-lg hover:border-yellow-300 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600">{task.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTask(task);
                                  }}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Aufgabe bearbeiten"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimTask(task.id);
                                }}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm font-medium whitespace-nowrap"
                              >
                                Übernehmen
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskId(task.id);
                                    setShowAssignTaskForm(true);
                                  }}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                                >
                                  Zuweisen
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Team Members' Tasks */}
                {assignedTasks.length > 0 && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b">
                      <h3 className="font-bold text-gray-900">Team Aufgaben ({assignedTasks.length})</h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {assignedTasks.map(task => {
                        const assignedUser = store.getUserById(task.assigned_to_user_id!);
                        return (
                          <div key={task.id} className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                                <p className="text-sm text-gray-500">
                                  Zugewiesen an: {assignedUser?.full_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAdmin && (
                                  <button
                                    onClick={() => handleEditTask(task)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Aufgabe bearbeiten"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                    task.status === 'Erledigt'
                                      ? 'bg-green-100 text-green-700'
                                      : task.status === 'In Bearbeitung'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {task.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {projectTasks.length === 0 && (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500">Noch keine Aufgaben in diesem Projekt</p>
                    {(isAdmin || selectedProjectData.assigned_user_ids.includes(user.id)) && (
                      <button
                        onClick={() => setShowNewTaskForm(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Erste Aufgabe erstellen
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Wählen Sie ein Projekt aus, um Aufgaben zu sehen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
