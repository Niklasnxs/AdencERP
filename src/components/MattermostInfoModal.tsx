import { X } from 'lucide-react';

interface MattermostInfoModalProps {
  title: string;
  linkLabel: string;
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MattermostInfoModal({
  title,
  linkLabel,
  url,
  isOpen,
  onClose,
}: MattermostInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Popup schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 inline-block rounded-lg bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {linkLabel}
          </a>

          <div className="space-y-5 text-sm leading-6 text-gray-800">
            <p>Liebe Kolleginnen und Kollegen,</p>
            <p>
              im Rahmen unserer internen Kommunikation und Projektorganisation setzen wir kuenftig Mattermost
              als zentrale Plattform ein. Damit ihr euch erfolgreich registrieren koennt, folgt bitte dieser
              kurzen Anleitung.
            </p>
            <div>
              <p className="font-semibold text-gray-900">Download: Mattermost Mobile and Desktop Apps</p>
              <a
                href="https://mattermost.com/apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                https://mattermost.com/apps/
              </a>
            </div>
            <div>
              <p className="mb-2 font-semibold text-gray-900">So meldet ihr euch bei Mattermost an</p>
              <p className="font-medium text-gray-900">1. Aufruf der Plattform</p>
              <p>Oeffnet folgenden Link in eurem Browser:</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                {url}
              </a>
            </div>
            <div>
              <p className="font-medium text-gray-900">2. Account erstellen</p>
              <p>Klickt auf "Registrieren" oder "Create Account".</p>
              <p>
                Gebt euren vollstaendigen Namen, eine gueltige E-Mail-Adresse und ein sicheres Passwort ein.
                Bestaetigt eure Registrierung gegebenenfalls per E-Mail.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">3. Anmeldung</p>
              <p>
                Nach erfolgreicher Registrierung koennt ihr euch jederzeit ueber denselben Link mit euren
                Zugangsdaten anmelden.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Wichtig</p>
              <p>
                Die Zuweisung zu den entsprechenden Teams (Abteilungen, Projekte etc.) erfolgt manuell durch
                einen Administrator. Sobald ihr euch registriert habt, werdet ihr zeitnah freigeschaltet und den
                passenden Teams hinzugefuegt.
              </p>
              <p>Ihr muesst also nichts weiter tun, ausser euren Account zu erstellen, wir kuemmern uns um den Rest.</p>
              <p>Bei Fragen oder Problemen koennt ihr euch gerne an mich oder unser Support-Team wenden.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
