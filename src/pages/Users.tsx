import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Users as UsersIcon, Plus, Shield, User, Edit, Trash2 } from 'lucide-react';
import type { UserRole, EmploymentType } from '../types';

export function Users() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState(store.getUsers());
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee' as UserRole,
    address: '',
    birthday: '',
    employment_type: '' as EmploymentType | '',
  });

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Zugriff verweigert</p>
          <p className="text-red-600 text-sm mt-1">
            Diese Seite ist nur für Administratoren zugänglich.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      const updates: any = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        address: formData.address || undefined,
        birthday: formData.birthday || undefined,
        employment_type: formData.employment_type || undefined,
      };
      
      // Only update password if provided
      if (formData.password) {
        updates.password = formData.password;
      }
      
      await store.updateUser(editingUser.id, updates);
      setEditingUser(null);
    } else {
      // Create new user
      await store.createUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        address: formData.address || undefined,
        birthday: formData.birthday || undefined,
        employment_type: formData.employment_type || undefined,
      });
    }
    
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'employee',
      address: '',
      birthday: '',
      employment_type: '',
    });
    setShowForm(false);
    // Refresh user list after API call completes
    setUsers(store.getUsers());
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      address: user.address || '',
      birthday: user.birthday || '',
      employment_type: user.employment_type || '',
    });
    setShowForm(true);
  };

  const handleDelete = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('Sie können Ihren eigenen Account nicht löschen!');
      return;
    }
    setDeletingUserId(userId);
  };

  const confirmDelete = async () => {
    if (deletingUserId) {
      await store.deleteUser(deletingUserId);
      setUsers(store.getUsers());
      setDeletingUserId(null);
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const employeeCount = users.filter(u => u.role === 'employee').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Benutzer anlegen und verwalten</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              email: '',
              password: '',
              full_name: '',
              role: 'employee',
              address: '',
              birthday: '',
              employment_type: '',
            });
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Neuer Benutzer
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer anlegen'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vollständiger Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Max Mustermann"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="max.mustermann@adenc.de"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'Neues Passwort (leer lassen für keine Änderung)' : 'Passwort *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rolle *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="employee">Mitarbeiter</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Employee Information Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Mitarbeiterinformationen</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="Straße, PLZ Ort"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Geburtsdatum
                    </label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschäftigungsart
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as EmploymentType | '' })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Nicht angegeben</option>
                      <option value="full_time">Vollzeit</option>
                      <option value="part_time">Teilzeit</option>
                      <option value="internship">Praktikum</option>
                      <option value="minijob">Minijob</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? 'Speichern' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
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

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Benutzer löschen?</h2>
            <p className="text-gray-600 mb-6">
              Möchten Sie diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Löschen
              </button>
              <button
                onClick={() => setDeletingUserId(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Benutzer</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administratoren</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{adminCount}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mitarbeiter</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{employeeCount}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 sm:px-6 py-4 border-b">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Alle Benutzer</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-sm">Name</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-sm hidden sm:table-cell">E-Mail</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-sm">Rolle</th>
                  <th className="text-right py-3 px-2 sm:px-4 font-medium text-gray-700 text-sm">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-gray-900 text-sm block truncate">{user.full_name}</span>
                          <span className="text-xs text-gray-500 sm:hidden block truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-4 text-sm text-gray-600 hidden sm:table-cell">{user.email}</td>
                    <td className="py-3 px-2 sm:px-4">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Mitarbeiter'}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Löschen"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="font-bold text-blue-900 mb-2 text-sm sm:text-base">Hinweis zur Benutzerverwaltung</h3>
        <p className="text-xs sm:text-sm text-blue-800">
          Nur Administratoren können neue Benutzerkonten erstellen. Die öffentliche Registrierung ist deaktiviert.
          Neue Mitarbeiter erhalten ihre Zugangsdaten vom Administrator.
        </p>
      </div>
    </div>
  );
}
