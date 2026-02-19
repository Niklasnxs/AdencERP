import { CalendarDays, Bot, Download, FileText, Image } from 'lucide-react';
import {
  DSGPT_URL,
  MARVIN_CALENDLY_URL,
  PERSONAL_QUESTIONNAIRE_URL,
  ZOOM_BACKGROUNDS_ZIP_URL,
} from '../config/branding';

export function ResourceLinksBox() {
  return (
    <div className="bg-white rounded-lg shadow mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Ressourcen & Downloads</h2>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href={ZOOM_BACKGROUNDS_ZIP_URL}
          download
          className="flex items-center gap-4 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
        >
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Image className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Zoom-Hintergründe</h3>
            <p className="text-sm text-gray-600">Alle als ZIP herunterladen</p>
          </div>
          <Download className="w-5 h-5 ml-auto text-indigo-700" />
        </a>

        <a
          href={PERSONAL_QUESTIONNAIRE_URL}
          download
          className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Personalfragebogen</h3>
            <p className="text-sm text-gray-600">PDF herunterladen</p>
          </div>
          <Download className="w-5 h-5 ml-auto text-blue-700" />
        </a>

        <a
          href={MARVIN_CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
        >
          <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Termin mit Marvin</h3>
            <p className="text-sm text-gray-600">Calendly öffnen</p>
          </div>
        </a>

        <a
          href={DSGPT_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors"
        >
          <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">DSGPT</h3>
            <p className="text-sm text-gray-600">Internen GPT öffnen</p>
          </div>
        </a>
      </div>
    </div>
  );
}
