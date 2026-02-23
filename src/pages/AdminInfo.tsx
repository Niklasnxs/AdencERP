import { useEffect, useMemo, useState } from 'react';
import { briefkastenAPI, checklistAPI, documentUploadsAPI } from '../services/api';
import type {
  DocumentUploadMeta,
  DocumentUploadOverview,
  OnboardingOverviewRow,
  SuggestionEntry,
  SuggestionStatus,
} from '../types';
import { useAuth } from '../AuthContext';
import { Download, X } from 'lucide-react';

const briefkastenStatuses: SuggestionStatus[] = ['Neu', 'In Bearbeitung', 'Erledigt'];

export function AdminInfo() {
  const { isAdmin } = useAuth();
  const [uploadOverview, setUploadOverview] = useState<DocumentUploadOverview[]>([]);
  const [checklistOverview, setChecklistOverview] = useState<OnboardingOverviewRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<DocumentUploadOverview | null>(null);
  const [selectedUserUploads, setSelectedUserUploads] = useState<DocumentUploadMeta[]>([]);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sortUploadOverview = (rows: DocumentUploadOverview[]) =>
    [...rows].sort((a, b) => {
      const unseenA = Number(a.unseen_count || 0);
      const unseenB = Number(b.unseen_count || 0);
      if (unseenB !== unseenA) return unseenB - unseenA;
      const timeA = a.latest_upload_at ? new Date(a.latest_upload_at).getTime() : 0;
      const timeB = b.latest_upload_at ? new Date(b.latest_upload_at).getTime() : 0;
      return timeB - timeA;
    });

  const load = async () => {
    setIsLoading(true);
    try {
      const [uploads, checklist, suggestionItems] = await Promise.all([
        documentUploadsAPI.getOverview(),
        checklistAPI.getAdminOverview(),
        briefkastenAPI.getAll(),
      ]);
      setUploadOverview(sortUploadOverview(uploads));
      setChecklistOverview(checklist);
      setSuggestions(suggestionItems);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Admin-Infos konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin]);

  const progressRows = useMemo(
    () =>
      checklistOverview.map((row) => ({
        ...row,
        percent: row.total_items > 0 ? Math.round((row.completed_items / row.total_items) * 100) : 0,
      })),
    [checklistOverview]
  );

  const openUserUploads = async (user: DocumentUploadOverview) => {
    setSelectedUser(user);
    setSelectedUserUploads([]);
    setIsLoadingUploads(true);
    try {
      const uploads = await documentUploadsAPI.getByUser(user.user_id);
      setSelectedUserUploads(uploads);
      setUploadOverview((prev) =>
        sortUploadOverview(prev.map((entry) =>
          entry.user_id === user.user_id
            ? { ...entry, unseen_count: 0, has_unseen: false }
            : entry
        ))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Uploads konnten nicht geladen werden.');
    } finally {
      setIsLoadingUploads(false);
    }
  };

  const downloadUpload = async (upload: DocumentUploadMeta) => {
    try {
      const blob = await documentUploadsAPI.download(upload.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = upload.original_filename || 'dokument';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download fehlgeschlagen.');
    }
  };

  const downloadSuggestionImage = async (entryId: string, filename?: string | null) => {
    try {
      const blob = await briefkastenAPI.downloadImage(entryId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || 'briefkasten-bild';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bild konnte nicht geladen werden.');
    }
  };

  const updateSuggestionStatus = async (entryId: string, status: SuggestionStatus) => {
    try {
      await briefkastenAPI.updateStatus(entryId, status);
      setSuggestions((prev) =>
        prev.map((entry) => (entry.id === entryId ? { ...entry, status } : entry))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Status konnte nicht aktualisiert werden.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
          Nur Admins haben Zugriff auf diese Seite.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin-Info</h1>
        <p className="text-gray-600 mt-1">
          Uploads, Onboarding-Status und Einträge aus dem internen Briefkasten.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Uploads pro Nutzer</h2>
        {isLoading ? (
          <p className="text-gray-600">Wird geladen...</p>
        ) : (
          <div className="space-y-2">
            {uploadOverview.map((user) => (
              <button
                key={user.user_id}
                onClick={() => openUserUploads(user)}
                className={`w-full text-left border rounded-lg px-4 py-3 hover:bg-gray-50 ${
                  user.has_unseen ? 'border-green-300 bg-green-50/70' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {user.full_name}
                      {user.has_unseen && <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-800">{user.upload_count} Uploads</p>
                    {Boolean(user.unseen_count) && (
                      <p className="text-xs font-semibold text-green-700">Neu: {user.unseen_count}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Onboarding-Fortschritt</h2>
        {isLoading ? (
          <p className="text-gray-600">Wird geladen...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Nutzer</th>
                  <th className="py-2 pr-2">E-Mail</th>
                  <th className="py-2 pr-2">Fortschritt</th>
                </tr>
              </thead>
              <tbody>
                {progressRows.map((row) => (
                  <tr key={row.user_id} className="border-b last:border-b-0">
                    <td className="py-2 pr-2 font-medium text-gray-900">{row.full_name}</td>
                    <td className="py-2 pr-2 text-gray-700">{row.email}</td>
                    <td className="py-2 pr-2 text-gray-700">
                      {row.completed_items}/{row.total_items} ({row.percent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Interner Briefkasten</h2>
        {isLoading ? (
          <p className="text-gray-600">Wird geladen...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-600">Noch keine Einträge vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-3 items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {entry.is_anonymous ? 'Anonym' : entry.full_name || 'Unbekannt'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(entry.created_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <select
                    value={entry.status}
                    onChange={(e) => updateSuggestionStatus(entry.id, e.target.value as SuggestionStatus)}
                    className="px-3 py-1 border rounded-md"
                  >
                    {briefkastenStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Kategorie:</span> {entry.category || 'Keine Angabe'}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {entry.message || 'Kein Text'}
                </p>
                {entry.has_image && (
                  <button
                    onClick={() => downloadSuggestionImage(entry.id, entry.image_filename)}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Bild herunterladen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedUser.full_name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingUploads ? (
              <p className="text-gray-600">Uploads werden geladen...</p>
            ) : selectedUserUploads.length === 0 ? (
              <p className="text-gray-600">Keine Uploads vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {selectedUserUploads.map((upload) => (
                  <div key={upload.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{upload.original_filename}</p>
                      <p className="text-sm text-gray-600">
                        {upload.category} • {Math.max(1, Math.round(upload.file_size / 1024))} KB •{' '}
                        {new Date(upload.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadUpload(upload)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-700 text-white hover:bg-blue-800"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
