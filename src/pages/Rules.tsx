import { APP_NAME } from '../config/branding';

export function Rules() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Regelwerk</h1>
        <p className="text-gray-600 mb-6">
          Zentrale Regeln und Hinweise für die Nutzung von {APP_NAME}.
        </p>

        <div className="space-y-8 text-gray-800 leading-7">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Einleitung und Geltungsbereich</h2>
            <p>
              Dieses Regelwerk gilt für alle Mitarbeitenden der ADence GmbH und Next Strategy AI GmbH,
              unabhängig von der Art des Arbeitsvertrags (Vollzeit, Teilzeit, Minijob, Praktikum, Freelancer,
              befristet oder unbefristet). Es regelt den Umgang mit Arbeitszeiten, Abwesenheiten und weiteren
              arbeitsrechtlichen Aspekten. Ziel ist eine transparente, faire und effiziente Organisation der
              Arbeit. Änderungen an diesem Regelwerk werden schriftlich mitgeteilt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Arbeitszeiten und Zeiterfassung</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reguläre Arbeitszeit bei Vollzeit: Montag bis Freitag von 9:00 bis 17:00 Uhr.</li>
              <li>Flexible Modelle wie Gleitzeit sind möglich, wenn betriebliche Anforderungen eingehalten werden.</li>
              <li>Arbeitszeiten sind alle zwei Stunden im Zeiterfassungssystem Google Drive zu dokumentieren.</li>
              <li>Beginn, Ende und Pausen sind einzutragen; ab mehr als sechs Stunden gilt mindestens 30 Minuten Pause.</li>
              <li>Bei Homeoffice oder mobiler Arbeit gelten dieselben Regeln mit tagesaktueller Eintragung.</li>
              <li>Einträge müssen Datum, Projekt, Leistung und Stunden enthalten.</li>
              <li>Stunden sind als Dezimalzahl einzutragen und werden nicht aufgerundet.</li>
              <li>Versäumte Einträge müssen bis zum Ende des Arbeitstags nachgetragen werden.</li>
              <li>Wiederholte Verstöße können zu einer Abmahnung führen.</li>
              <li>Überstunden sind nur mit vorheriger Genehmigung durch die vorgesetzte Person zulässig.</li>
              <li>Pausenregelungen sind verbindlich und dürfen nicht übersprungen werden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Krankmeldungen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Bei Krankheit ist der Arbeitgeber unverzüglich, spätestens vor Arbeitsbeginn, zu informieren
                (Telefon, E-Mail oder Messenger an Marvin de Vries) inklusive voraussichtlicher Dauer.
              </li>
              <li>
                Ab dem vierten Krankheitstag ist eine Arbeitsunfähigkeitsbescheinigung (eAU) erforderlich.
                Falls vertraglich vereinbart, kann die Vorlage bereits ab Tag eins gelten.
              </li>
              <li>
                Krankheit während des Urlaubs ist sofort zu melden. Krankheitstage werden bei ärztlichem Attest
                nicht auf den Urlaub angerechnet. Im Ausland ist ein lokales Attest erforderlich.
              </li>
              <li>Entgeltfortzahlung erfolgt bis zu sechs Wochen in Höhe von 100 Prozent des Gehalts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Urlaubsanmeldungen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Urlaubsanspruch richtet sich nach dem Vertrag. Teilzeitkräfte erhalten anteiligen Anspruch.
                Urlaub ist grundsätzlich im laufenden Kalenderjahr zu nehmen.
              </li>
              <li>
                Urlaubsanträge werden vorab schriftlich per E-Mail oder Messenger bei Tatjana Wolf gestellt.
              </li>
              <li>
                Entscheidungen berücksichtigen betriebliche Anforderungen. Ablehnungen sind mit Begründung möglich.
              </li>
              <li>
                Sonderurlaub kann für besondere Ereignisse gewährt werden. Bei Erkrankung eines Kindes gelten die
                gesetzlichen Regelungen.
              </li>
              <li>
                Genehmigter Urlaub kann nicht einseitig widerrufen werden, außer bei dringenden Gründen.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Einsatz von KI-Tools</h2>
            <p>
              Der Einsatz von KI-Tools ist zulässig, sofern er produktiv und im Rahmen der Unternehmensziele
              erfolgt. Sensible Daten, personenbezogene Informationen, vertrauliche Geschäftsdaten und geschützte
              interne Inhalte dürfen nicht in öffentliche KI-Systeme eingegeben werden. Bei Unsicherheiten ist die
              vorgesetzte Person einzubeziehen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Kommunikation und Meetings</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Während der regulären Arbeitszeiten ist Erreichbarkeit über Telefon, E-Mail oder Messenger verpflichtend.</li>
              <li>Abweichungen können im Einzelfall mit der vorgesetzten Person abgestimmt werden.</li>
              <li>Meetings sind pünktlich und vorbereitet wahrzunehmen.</li>
              <li>Interne Feedbackgespräche finden einmal pro Quartal statt.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Verwendung von Firmenressourcen</h2>
            <p>
              Firmenressourcen wie Laptops, Mobilgeräte, Zugangsdaten, Software und technische Hilfsmittel sind
              ausschließlich für unternehmensbezogene Tätigkeiten zu verwenden. Private Nutzung ist nur in
              Ausnahmefällen mit vorheriger Genehmigung erlaubt. Schäden oder Verluste durch fahrlässigen Gebrauch
              sind unverzüglich zu melden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Weitere Regelungen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gesetzliche Feiertage sind arbeitsfrei. Es gilt der Standort Hamburg.</li>
              <li>Homeoffice ist nach Absprache möglich; Zeiterfassung bleibt verpflichtend.</li>
              <li>Datenschutz und Vertraulichkeit gelten für alle Meldungen und personenbezogenen Angaben.</li>
              <li>Verstöße gegen dieses Regelwerk können zu Abmahnungen oder Kündigungen führen.</li>
              <li>
                Kontakt bei Fragen:{' '}
                <a href="mailto:personal@devven.de" className="text-blue-700 underline">
                  personal@devven.de
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
