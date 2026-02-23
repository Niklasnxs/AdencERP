import { useRef, useState } from 'react';
import { briefkastenAPI, documentUploadsAPI } from '../services/api';
import { fileToBase64 } from '../utils/fileToBase64';
import type { SuggestionCategory, UploadCategory } from '../types';
import { Upload, Send } from 'lucide-react';

const uploadCategories: UploadCategory[] = [
  'Personalfragebogen',
  'Urlaub',
  'Krankheit',
  'Bildungsträger',
  'Sonstiges',
];

const suggestionCategories: SuggestionCategory[] = [
  'Einkaufsliste',
  'Verbesserungsvorschlag',
  'Problem/Kummerkasten',
  'Sonstiges',
];

export function InternalMailbox() {
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionImageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadCategory, setUploadCategory] = useState<UploadCategory>('Bildungsträger');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadSaving, setIsUploadSaving] = useState(false);

  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [suggestionCategory, setSuggestionCategory] = useState<SuggestionCategory | ''>('');
  const [suggestionAnonymous, setSuggestionAnonymous] = useState(false);
  const [suggestionImage, setSuggestionImage] = useState<File | null>(null);
  const [isSuggestionSaving, setIsSuggestionSaving] = useState(false);

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Bitte eine Datei auswählen.');
      return;
    }

    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(uploadFile.type)) {
      alert('Nur PDF oder DOCX sind erlaubt.');
      return;
    }

    if (uploadFile.size > 10 * 1024 * 1024) {
      alert('Maximal 10 MB erlaubt.');
      return;
    }

    setIsUploadSaving(true);
    try {
      const dataBase64 = await fileToBase64(uploadFile);
      await documentUploadsAPI.create({
        category: uploadCategory,
        file: {
          name: uploadFile.name,
          type: uploadFile.type,
          size: uploadFile.size,
          dataBase64,
        },
      });
      setUploadFile(null);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
      alert('Dokument erfolgreich hochgeladen.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload fehlgeschlagen.');
    } finally {
      setIsUploadSaving(false);
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestionImage && suggestionImage.size > 10 * 1024 * 1024) {
      alert('Bild ist größer als 10 MB.');
      return;
    }
    setIsSuggestionSaving(true);
    try {
      const imagePayload = suggestionImage
        ? {
            name: suggestionImage.name,
            type: suggestionImage.type,
            size: suggestionImage.size,
            dataBase64: await fileToBase64(suggestionImage),
          }
        : null;

      await briefkastenAPI.create({
        message: suggestionMessage.trim() || undefined,
        category: suggestionCategory || undefined,
        is_anonymous: suggestionAnonymous,
        image: imagePayload,
      });

      setSuggestionMessage('');
      setSuggestionCategory('');
      setSuggestionAnonymous(false);
      setSuggestionImage(null);
      if (suggestionImageInputRef.current) {
        suggestionImageInputRef.current.value = '';
      }
      alert('Eintrag wurde gespeichert.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Eintrag konnte nicht gespeichert werden.');
    } finally {
      setIsSuggestionSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Interner Briefkasten</h1>
          <p className="text-gray-600">
            Hier kannst du Dokumente hochladen und Wünsche oder Hinweise einreichen.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dokument hochladen (nur für Admins sichtbar)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Erlaubt sind PDF und DOCX bis 10 MB.
          </p>
          <form className="space-y-4" onSubmit={handleDocumentUpload}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as UploadCategory)}
                className="w-full md:w-80 px-4 py-2 border rounded-lg"
              >
                {uploadCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Datei</label>
              <input
                ref={documentInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full md:w-[420px] px-4 py-2 border rounded-lg bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={isUploadSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {isUploadSaving ? 'Wird hochgeladen...' : 'Dokument hochladen'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wunsch oder Hinweis einreichen</h2>
          <p className="text-sm text-gray-600 mb-4">
            Du kannst deinen Namen optional ausblenden und zusätzlich ein Bild hochladen.
          </p>
          <form className="space-y-4" onSubmit={handleSuggestionSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie (optional)</label>
              <select
                value={suggestionCategory}
                onChange={(e) => setSuggestionCategory(e.target.value as SuggestionCategory | '')}
                className="w-full md:w-80 px-4 py-2 border rounded-lg"
              >
                <option value="">Keine Angabe</option>
                {suggestionCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text (optional)</label>
              <textarea
                value={suggestionMessage}
                onChange={(e) => setSuggestionMessage(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg h-28"
                placeholder="Dein Wunsch, Hinweis oder Thema..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bild (optional, max. 10 MB)</label>
              <input
                ref={suggestionImageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setSuggestionImage(e.target.files?.[0] || null)}
                className="w-full md:w-[420px] px-4 py-2 border rounded-lg bg-white"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={suggestionAnonymous}
                onChange={(e) => setSuggestionAnonymous(e.target.checked)}
                className="w-4 h-4"
              />
              Anonym senden (Name wird für Admins ausgeblendet)
            </label>
            <button
              type="submit"
              disabled={isSuggestionSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {isSuggestionSaving ? 'Wird gesendet...' : 'In Briefkasten senden'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
