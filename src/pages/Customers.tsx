import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import type { Customer } from '../types';

export function Customers() {
  const { user, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>(store.getCustomers());
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCustomers(store.getCustomers());
  }, []);

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
        <p className="text-gray-600 mt-2">Nur für Administratoren sichtbar.</p>
      </div>
    );
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    setIsSaving(true);
    try {
      const created = await store.createCustomer({ name: newCustomerName.trim(), is_active: true });
      setCustomers((prev) => [...prev, created]);
      setNewCustomerName('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kundenverwaltung</h1>
        <p className="text-gray-600 mt-1">Kunden anlegen und verwalten</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Neuen Kunden anlegen</h2>
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kundenname
            </label>
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="z.B. Musterkunde GmbH"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isSaving ? 'Speichern...' : 'Kunde anlegen'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktive Kunden</h2>
        {customers.filter(c => c.is_active).length === 0 ? (
          <p className="text-gray-500">Noch keine Kunden vorhanden.</p>
        ) : (
          <ul className="space-y-2">
            {customers
              .filter(c => c.is_active)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(customer => (
                <li key={customer.id} className="border rounded-md px-4 py-3">
                  {customer.name}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
