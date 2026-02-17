import { APP_NAME } from '../config/branding';

export function CockpitGuide() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Anleitung Cockpit</h1>
        <p className="text-gray-600 mb-6">
          Einfuehrung und Nutzungshinweise fuer {APP_NAME}.
        </p>

        <div className="space-y-6 text-gray-800 leading-7">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Wofuer das Tool genutzt wird</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tagesstatus eintragen und bei Bedarf korrigieren</li>
              <li>Abwesenheiten wie Urlaub, Krankheit, Schule oder Homeoffice dokumentieren</li>
              <li>Monatliche Anwesenheit fuer den eigenen Account bestaetigen</li>
              <li>Wichtige Team-Links und persoenliche Zugangsinfos zentral abrufen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">So funktioniert die Bedienung</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Einloggen und den Kalender oeffnen.</li>
              <li>Auf einen Tag klicken und den passenden Status waehlen.</li>
              <li>Speichern, damit der Status fuer den Tag uebernommen wird.</li>
              <li>Bei Fehlern den Tag erneut oeffnen und Status aendern oder loeschen.</li>
              <li>Bei Bedarf den Monat gesammelt als anwesend bestaetigen.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Wichtige Hinweise</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Eintraege sollten taeglich gepflegt werden, damit die Uebersicht aktuell bleibt.</li>
              <li>Nachtraegliche Korrekturen sind moeglich und ausdruecklich vorgesehen.</li>
              <li>Bei Fragen oder fehlenden Daten bitte die verantwortliche Ansprechperson informieren.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
