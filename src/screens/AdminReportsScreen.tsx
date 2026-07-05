import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Report } from '../types/database';
import Badge from '../components/Badge';

export default function AdminReportsScreen({ onBack, showToast }: { onBack: () => void; showToast: (msg: string) => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('reports').select('*, listing:listings(*, category:categories(*)), reporter:profiles!reports_reporter_id_fkey(*)').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReports(data as Report[]); setLoading(false); });
  }, []);

  async function handleStatusChange(id: string, status: 'reviewed' | 'resolved') {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('reports').update({ status, reviewed_by: user?.id }).eq('id', id);
    if (!error) { setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r))); showToast('Statut mis à jour'); }
  }

  async function handleDeleteListing(report: Report) {
    if (!confirm("Supprimer l'annonce signalée ?")) return;
    if (report.listing_id) {
      await supabase.from('listings').delete().eq('id', report.listing_id);
      await supabase.from('reports').delete().eq('id', report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      showToast('Annonce supprimée');
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-[#1E5C20] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-white flex items-center gap-2 font-semibold"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="flex-1 text-white font-extrabold text-lg">Signalements</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun signalement</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <Badge status={report.status} />
                    </div>
                    <h4 className="font-bold text-sm mt-2 truncate">{report.listing?.title || 'Annonce supprimée'}</h4>
                    <p className="text-xs text-gray-500 mt-1">{report.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">Par: {report.reporter?.name || 'Anonyme'} • {new Date(report.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                {report.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleStatusChange(report.id, 'reviewed')} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">Examiner</button>
                    <button onClick={() => handleStatusChange(report.id, 'resolved')} className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-semibold">Résoudre</button>
                    <button onClick={() => handleDeleteListing(report)} className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
