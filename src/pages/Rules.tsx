import { APP_NAME } from '../config/branding';

export function Rules() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8 min-h-[320px]">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Regelwerk</h1>
        <p className="text-gray-600 mb-6">
          Zentrale Regeln und Hinweise für die Nutzung von {APP_NAME}.
        </p>
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-gray-500 min-h-[180px]">
          Inhalte folgen.
        </div>
      </div>
    </div>
  );
}
