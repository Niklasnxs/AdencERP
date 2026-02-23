import { APP_NAME } from '../config/branding';

export function CockpitGuide() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Anleitung Cockpit</h1>
        <p className="text-gray-600 mb-6">
          Einführung und Nutzungshinweise für {APP_NAME}.
        </p>

        <div className="space-y-6 text-gray-800 leading-7">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Wofür das Tool genutzt wird</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tagesstatus eintragen und bei Bedarf korrigieren</li>
              <li>Abwesenheiten wie Urlaub, Krankheit, Schule oder Homeoffice dokumentieren</li>
              <li>Monatliche Anwesenheit für den eigenen Account bestätigen</li>
              <li>Dokumente für Admins und insbesondere für Marvin strukturiert hochladen</li>
              <li>Wünsche, Anregungen oder Hinweise über den internen Briefkasten einreichen</li>
              <li>Onboarding-Schritte über die persönliche Checkliste sichtbar abhaken</li>
              <li>Wichtige Team-Links und persönliche Zugangsinfos zentral abrufen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">So funktioniert die Bedienung</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Einloggen und den Kalender öffnen.</li>
              <li>Auf einen Tag klicken und den passenden Status wählen.</li>
              <li>Speichern, damit der Status für den Tag übernommen wird.</li>
              <li>Bei Fehlern den Tag erneut öffnen und Status ändern oder löschen.</li>
              <li>Für Urlaub, Homeoffice und Schule könnt ihr Zeiträume eintragen, damit nicht jeder Tag einzeln gesetzt werden muss.</li>
              <li>Zum Monatsende bitte die Anwesenheit bestätigen, damit alle Tage den richtigen Status haben. Das macht ihr über den Button auf der Seite „Kalender“.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Wichtige Hinweise</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Einträge sollten täglich gepflegt werden, damit die Übersicht aktuell bleibt.</li>
              <li>Nachträgliche Korrekturen sind möglich und ausdrücklich vorgesehen.</li>
              <li>Unter „Interner Briefkasten“ können wichtige Dokumente wie Nachweise für Bildungsträger hochgeladen werden. Diese Uploads sind nur für Admins einsehbar.</li>
              <li>Im internen Briefkasten können zusätzlich Wünsche eingereicht werden, zum Beispiel für die Einkaufsliste im Büro (Getränke, Snacks) oder andere Themen.</li>
              <li>Über die Seite „Checkliste“ kann jede Person den eigenen Onboarding-Stand pflegen; Admins sehen den Gesamtfortschritt zentral in „Admin-Info“.</li>
              <li>Bei Fragen oder fehlenden Daten bitte die verantwortliche Ansprechperson informieren.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
