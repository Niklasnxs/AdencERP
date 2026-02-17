import { X } from 'lucide-react';
import type { User } from '../types';

interface EmailAccessModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailAccessModal({ user, isOpen, onClose }: EmailAccessModalProps) {
  if (!isOpen) return null;

  const loginEmail = user.email_login || user.email || 'Nicht hinterlegt';
  const loginPassword = user.email_password || 'Nicht hinterlegt';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-xl font-bold text-gray-900">E-Mail Zugang</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Popup schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6 text-sm leading-7 text-gray-800 space-y-4">
          <p>Hallo {user.full_name},</p>
          <p>anbei die wichtigsten Zugaenge fuer die Kommunikation.</p>

          <div>
            <p className="font-semibold text-gray-900">Informationen zur Einrichtung des E-Mail-Programms</p>
            <p className="mt-2 font-medium text-gray-900">Benutzername/Kontoname</p>
            <p>{loginEmail}</p>
            <p className="mt-2 font-medium text-gray-900">Passwort/Kennwort</p>
            <p>{loginPassword}</p>
            <p className="mt-2 font-medium text-gray-900">Ein-/Ausgangsserver</p>
            <p>v167832.kasserver.com</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Desktop und Smartphone</p>
            <p>Mozilla Thunderbird herunterladen</p>
            <a
              href="https://www.thunderbird.net/de/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline"
            >
              https://www.thunderbird.net/de/
            </a>
          </div>

          <div>
            <p className="font-semibold text-gray-900">E-Mails einrichten</p>
            <p>1. E-Mail-Adresse</p>
            <p>2. Passwort</p>
            <p>Eintragen und fertig.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
