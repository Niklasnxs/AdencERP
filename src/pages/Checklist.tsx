import { useEffect, useMemo, useState } from 'react';
import { checklistAPI } from '../services/api';
import type { OnboardingChecklistItem } from '../types';
import { CheckCircle2 } from 'lucide-react';

export function Checklist() {
  const [items, setItems] = useState<OnboardingChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await checklistAPI.getOwn();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkliste konnte nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const progress = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => item.completed).length;
    return { total, done };
  }, [items]);

  const handleToggle = async (item: OnboardingChecklistItem) => {
    setIsSavingKey(item.item_key);
    try {
      const updated = await checklistAPI.updateOwn(item.item_key, !item.completed);
      setItems((prev) =>
        prev.map((existing) => (existing.item_key === updated.item_key ? updated : existing))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Eintrag konnte nicht gespeichert werden.');
    } finally {
      setIsSavingKey(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkliste</h1>
            <p className="text-gray-600 mt-1">
              Behalte deine Onboarding-Schritte im Blick und hake erledigte Punkte selbst ab.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-4 py-3 min-w-[140px] text-center">
            <p className="text-xs uppercase tracking-wide font-semibold">Fortschritt</p>
            <p className="text-2xl font-bold">
              {progress.done}/{progress.total}
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-gray-600">Checkliste wird geladen...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item.item_key}
                onClick={() => handleToggle(item)}
                disabled={isSavingKey === item.item_key}
                className={`w-full flex items-center gap-4 text-left border rounded-lg px-4 py-4 transition-colors ${
                  item.completed
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 className={`w-6 h-6 ${item.completed ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium">{item.item_label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
