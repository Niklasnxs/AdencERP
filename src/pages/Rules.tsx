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
              Dieses Regelwerk gilt fuer alle Mitarbeitenden der ADence GmbH und Next Strategy AI GmbH,
              unabhaengig von der Art des Arbeitsvertrags (Vollzeit, Teilzeit, Minijob, Praktikum, Freelancer,
              befristet oder unbefristet). Es regelt den Umgang mit Arbeitszeiten, Abwesenheiten und weiteren
              arbeitsrechtlichen Aspekten. Ziel ist eine transparente, faire und effiziente Organisation der
              Arbeit. Aenderungen an diesem Regelwerk werden schriftlich mitgeteilt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Arbeitszeiten und Zeiterfassung</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Regulaere Arbeitszeit bei Vollzeit: Montag bis Freitag von 9:00 bis 17:00 Uhr.</li>
              <li>Flexible Modelle wie Gleitzeit sind moeglich, wenn betriebliche Anforderungen eingehalten werden.</li>
              <li>Arbeitszeiten sind alle zwei Stunden im Zeiterfassungssystem Google Drive zu dokumentieren.</li>
              <li>Beginn, Ende und Pausen sind einzutragen; ab mehr als sechs Stunden gilt mindestens 30 Minuten Pause.</li>
              <li>Bei Homeoffice oder mobiler Arbeit gelten dieselben Regeln mit tagesaktueller Eintragung.</li>
              <li>Eintraege muessen Datum, Projekt, Leistung und Stunden enthalten.</li>
              <li>Stunden sind als Dezimalzahl einzutragen und werden nicht aufgerundet.</li>
              <li>Versaeumte Eintraege muessen bis zum Ende des Arbeitstags nachgetragen werden.</li>
              <li>Wiederholte Verstoesse koennen zu einer Abmahnung fuehren.</li>
              <li>Ueberstunden sind nur mit vorheriger Genehmigung durch die vorgesetzte Person zulaessig.</li>
              <li>Pausenregelungen sind verbindlich und duerfen nicht uebersprungen werden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Krankmeldungen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Bei Krankheit ist der Arbeitgeber unverzueglich, spaetestens vor Arbeitsbeginn, zu informieren
                (Telefon, E-Mail oder Messenger an Marvin de Vries) inklusive voraussichtlicher Dauer.
              </li>
              <li>
                Ab dem vierten Krankheitstag ist eine Arbeitsunfaehigkeitsbescheinigung (eAU) erforderlich.
                Falls vertraglich vereinbart, kann die Vorlage bereits ab Tag eins gelten.
              </li>
              <li>
                Krankheit waehrend des Urlaubs ist sofort zu melden. Krankheitstage werden bei aerztlichem Attest
                nicht auf den Urlaub angerechnet. Im Ausland ist ein lokales Attest erforderlich.
              </li>
              <li>Entgeltfortzahlung erfolgt bis zu sechs Wochen in Hoehe von 100 Prozent des Gehalts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Urlaubsanmeldungen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Urlaubsanspruch richtet sich nach dem Vertrag. Teilzeitkraefte erhalten anteiligen Anspruch.
                Urlaub ist grundsaetzlich im laufenden Kalenderjahr zu nehmen.
              </li>
              <li>
                Urlaubsantraege werden vorab schriftlich per E-Mail oder Messenger bei Tatjana Wolf gestellt.
              </li>
              <li>
                Entscheidungen beruecksichtigen betriebliche Anforderungen. Ablehnungen sind mit Begruendung moeglich.
              </li>
              <li>
                Sonderurlaub kann fuer besondere Ereignisse gewaehrt werden. Bei Erkrankung eines Kindes gelten die
                gesetzlichen Regelungen.
              </li>
              <li>
                Genehmigter Urlaub kann nicht einseitig widerrufen werden, ausser bei dringenden Gruenden.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Einsatz von KI-Tools</h2>
            <p>
              Der Einsatz von KI-Tools ist zulaessig, sofern er produktiv und im Rahmen der Unternehmensziele
              erfolgt. Sensible Daten, personenbezogene Informationen, vertrauliche Geschaeftsdaten und geschuetzte
              interne Inhalte duerfen nicht in oeffentliche KI-Systeme eingegeben werden. Bei Unsicherheiten ist die
              vorgesetzte Person einzubeziehen.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Kommunikation und Meetings</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Waehrend der regulaeren Arbeitszeiten ist Erreichbarkeit ueber Telefon, E-Mail oder Messenger verpflichtend.</li>
              <li>Abweichungen koennen im Einzelfall mit der vorgesetzten Person abgestimmt werden.</li>
              <li>Meetings sind puenktlich und vorbereitet wahrzunehmen.</li>
              <li>Interne Feedbackgespraeche finden einmal pro Quartal statt.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Verwendung von Firmenressourcen</h2>
            <p>
              Firmenressourcen wie Laptops, Mobilgeraete, Zugangsdaten, Software und technische Hilfsmittel sind
              ausschliesslich fuer unternehmensbezogene Taetigkeiten zu verwenden. Private Nutzung ist nur in
              Ausnahmefaellen mit vorheriger Genehmigung erlaubt. Schaeden oder Verluste durch fahrlaessigen Gebrauch
              sind unverzueglich zu melden.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Weitere Regelungen</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gesetzliche Feiertage sind arbeitsfrei. Es gilt der Standort Hamburg.</li>
              <li>Homeoffice ist nach Absprache moeglich; Zeiterfassung bleibt verpflichtend.</li>
              <li>Datenschutz und Vertraulichkeit gelten fuer alle Meldungen und personenbezogenen Angaben.</li>
              <li>Verstoesse gegen dieses Regelwerk koennen zu Abmahnungen oder Kuendigungen fuehren.</li>
              <li>
                Kontakt bei Fragen: Tatjana Wolf,{' '}
                <a href="mailto:tatjana.wolf@adence.de" className="text-blue-700 underline">
                  tatjana.wolf@adence.de
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
