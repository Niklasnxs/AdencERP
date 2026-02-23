import { useState } from 'react';
import { CalendarDays, Bot, Download, FileText, GraduationCap, Image, X } from 'lucide-react';
import {
  DSGPT_URL,
  MARVIN_CALENDLY_URL,
  ONLINE_COURSE_LOGIN,
  ONLINE_COURSE_PASSWORD,
  ONLINE_COURSE_URL,
  PERSONAL_QUESTIONNAIRE_URL,
  WORDPRESS_COURSE_LOGIN,
  WORDPRESS_COURSE_PASSWORD,
  WORDPRESS_COURSE_URL,
  YUMI_ACADEMY_LOGIN,
  YUMI_ACADEMY_PASSWORD,
  YUMI_ACADEMY_URL,
  ZOOM_BACKGROUNDS_ZIP_URL,
} from '../config/branding';

interface CourseInfo {
  key: 'online' | 'wordpress' | 'yumi';
  title: string;
  link: string;
  login: string;
  password: string;
}

const courseCards: CourseInfo[] = [
  {
    key: 'online',
    title: 'Online-Kurse',
    link: ONLINE_COURSE_URL,
    login: ONLINE_COURSE_LOGIN,
    password: ONLINE_COURSE_PASSWORD,
  },
  {
    key: 'wordpress',
    title: 'WordPress-Lernvideos',
    link: WORDPRESS_COURSE_URL,
    login: WORDPRESS_COURSE_LOGIN,
    password: WORDPRESS_COURSE_PASSWORD,
  },
  {
    key: 'yumi',
    title: 'Yumi Lernakademie',
    link: YUMI_ACADEMY_URL,
    login: YUMI_ACADEMY_LOGIN,
    password: YUMI_ACADEMY_PASSWORD,
  },
];

export function ResourceLinksBox() {
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo | null>(null);

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Ressourcen & Downloads</h2>
          <p className="text-sm text-gray-600 mt-1">Zentrale Links, Formulare und Lerninhalte.</p>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Dokumente & Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Lernplattformen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courseCards.map((course) => (
                <button
                  key={course.key}
                  onClick={() => setSelectedCourse(course)}
                  className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{course.title}</h4>
                    <p className="text-sm text-gray-600">Login und Kurslink anzeigen</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedCourse.title}</h3>
              <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <a
                href={selectedCourse.link || '#'}
                target={selectedCourse.link ? '_blank' : undefined}
                rel={selectedCourse.link ? 'noreferrer' : undefined}
                className={`inline-block px-4 py-2 rounded-lg font-medium ${
                  selectedCourse.link
                    ? 'bg-blue-700 text-white hover:bg-blue-800'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
                }`}
              >
                Zum Kurs
              </a>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Login:</span>{' '}
                  {selectedCourse.login || 'Wird ergänzt'}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Passwort:</span>{' '}
                  {selectedCourse.password || 'Wird ergänzt'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
