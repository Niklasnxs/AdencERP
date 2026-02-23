import { APP_NAME } from '../config/branding';
import { Link } from 'react-router-dom';

export function CockpitGuide() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Anleitung Cockpit</h1>
        <p className="text-gray-600 mb-6">
          Einführung und Nutzungshinweise für {APP_NAME}.
        </p>

        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Start für den ersten Tag</h2>
          <ol className="list-decimal pl-6 space-y-1 text-blue-900">
            <li>
              <Link to="/regelwerk" className="underline font-medium">Regelwerk</Link> lesen und bestätigen
            </li>
            <li>
              In der <Link to="/checkliste" className="underline font-medium">Checkliste</Link> die ersten Punkte abhaken
            </li>
            <li>
              Im <Link to="/kalender" className="underline font-medium">Kalender</Link> den Tagesstatus eintragen
            </li>
            <li>
              In der <Link to="/uebersicht" className="underline font-medium">Übersicht</Link> wichtige Links und Ressourcen prüfen
            </li>
          </ol>
        </div>

        <div className="space-y-8 text-gray-800 leading-7">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Wofür das Tool genutzt wird</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Anwesenheiten und Abwesenheiten täglich dokumentieren</li>
              <li>Monatsstatus sauber prüfen und bestätigen</li>
              <li>Wichtige Unterlagen direkt im Tool hochladen statt per E-Mail</li>
              <li>Wünsche und Hinweise über den internen Briefkasten einreichen</li>
              <li>Onboarding-Schritte transparent über die Checkliste abhaken</li>
              <li>Wichtige Team-Links und Downloads zentral nutzen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Kalender richtig nutzen</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>
                Öffne den <Link to="/kalender" className="underline font-medium">Kalender</Link> und klicke auf den gewünschten Tag.
              </li>
              <li>Wähle den passenden Status und speichere den Eintrag.</li>
              <li>Wenn ein Fehler passiert ist, den Tag erneut öffnen und den Status korrigieren oder löschen.</li>
              <li>Für Urlaub, Schule und Homeoffice Zeiträume nutzen, damit nicht jeder Tag einzeln gesetzt werden muss.</li>
              <li>Am Monatsende alle Tage prüfen und den Monat bestätigen.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Interner Briefkasten nutzen</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Im <Link to="/interner-briefkasten" className="underline font-medium">Internen Briefkasten</Link> können wichtige Dokumente hochgeladen werden, z. B. Nachweise für Bildungsträger.
              </li>
              <li>Diese Uploads sind nur für Admins sichtbar (inklusive Marvin/Admin-Team).</li>
              <li>Zusätzlich können Wünsche und Anregungen eingereicht werden, z. B. Getränke oder Snacks für das Büro.</li>
              <li>Einträge können auf Wunsch anonym gesendet werden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Checkliste und Übersicht</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                In der <Link to="/checkliste" className="underline font-medium">Checkliste</Link> werden alle relevanten Onboarding-Schritte gepflegt.
              </li>
              <li>Jede Person pflegt den eigenen Fortschritt selbst.</li>
              <li>
                In der <Link to="/uebersicht" className="underline font-medium">Übersicht</Link> findest du Zoom, Mattermost, DSGPT und wichtige Downloads.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Empfohlener Tagesablauf</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Morgens Kalender öffnen und Status prüfen.</li>
              <li>Tagsüber Änderungen direkt eintragen (z. B. Homeoffice, krank, Schule).</li>
              <li>Dokumente bei Bedarf direkt im Briefkasten hochladen.</li>
              <li>Zum Monatsende Kalender komplett prüfen und Monat bestätigen.</li>
            </ol>
          </section>
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-amber-900 mb-2">Wichtig</h2>
          <ul className="list-disc pl-6 space-y-1 text-amber-900">
            <li>Einträge möglichst täglich pflegen, damit die Daten korrekt und vollständig bleiben.</li>
            <li>Nachträgliche Korrekturen sind möglich und ausdrücklich vorgesehen.</li>
            <li>
              Bei Fragen bitte frühzeitig über Teamkanäle oder die verantwortliche Ansprechperson melden.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
