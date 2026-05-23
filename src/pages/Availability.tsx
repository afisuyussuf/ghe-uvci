import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Save, CheckCircle2, Clock, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getThemedSwal } from '../lib/swal';

const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const creneaux = [
  { id: 'matin', label: 'Matin', time: '08:00 - 12:00' },
  { id: 'aprem', label: 'Après-midi', time: '13:00 - 17:00' },
  { id: 'soir', label: 'Soir', time: '18:00 - 21:00' }
];

export default function AvailabilityPage() {
  const { profile } = useAuth();
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetch(`/api/disponibilites?userId=${profile.id}`)
        .then(res => res.json())
        .then(data => {
          const initial: Record<string, string[]> = {};
          data.forEach((d: any) => {
            if (!initial[d.jour]) initial[d.jour] = [];
            initial[d.jour].push(d.creneau);
          });
          setSelections(initial);
        });
    }
  }, [profile]);

  const toggleCreneau = (jour: string, creneau: string) => {
    setSelections(prev => {
      const current = prev[jour] || [];
      if (current.includes(creneau)) {
        return { ...prev, [jour]: current.filter(c => c !== creneau) };
      } else {
        return { ...prev, [jour]: [...current, creneau] };
      }
    });
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setIsSaving(true);
    try {
      const data = Object.entries(selections).flatMap(([jour, creneaux]) => 
        creneaux.map(creneau => ({ jour, creneau }))
      );

      const res = await fetch('/api/disponibilites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, disponibilites: data })
      });

      if (res.ok) {
        getThemedSwal().fire('Succès', 'Vos disponibilités ont été mises à jour.', 'success');
      }
    } catch (error) {
      getThemedSwal().fire('Erreur', 'Échec de la mise à jour.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
            <Calendar className="text-uvci-purple" size={32} />
            Mes Disponibilités
          </h1>
          <p className="text-slate-500">Déclarez vos créneaux libres pour faciliter la planification des cours.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-uvci-purple rounded-xl shadow-lg px-8 gap-2"
        >
          {isSaving ? <span className="loading loading-spinner loading-sm" /> : <Save size={20} />}
          Enregistrer mes choix
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Info size={24} />
        </div>
        <div className="text-sm text-blue-700 leading-relaxed">
          <p className="font-bold mb-1">Comment ça marche ?</p>
          <p>Cliquez sur les cases correspondant à vos moments de liberté. Ces informations sont transmises aux secrétaires de département pour l'élaboration de l'emploi du temps. Une mise à jour régulière est recommandée.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-slate-400 font-medium bg-slate-50 sticky left-0 z-10 w-40">Jour / Créneau</th>
                {creneaux.map(c => (
                  <th key={c.id} className="p-6 text-center">
                    <p className="text-slate-900 font-bold">{c.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{c.time}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jours.map((jour, i) => (
                <tr key={jour} className="border-b border-slate-50 last:border-0">
                  <td className="p-6 font-bold text-slate-700 bg-slate-50/30 sticky left-0 z-10">
                    {jour}
                  </td>
                  {creneaux.map(c => {
                    const isSelected = selections[jour]?.includes(c.id);
                    return (
                      <td key={c.id} className="p-6 text-center">
                        <button
                          onClick={() => toggleCreneau(jour, c.id)}
                          className={`w-full py-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                            isSelected 
                              ? 'bg-uvci-purple/5 border-uvci-purple text-uvci-purple shadow-sm' 
                              : 'bg-white border-dashed border-slate-200 text-slate-300 hover:border-uvci-purple/30 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 size={24} className="animate-in zoom-in duration-300" />
                              <span className="text-xs font-bold">Disponible</span>
                            </>
                          ) : (
                            <>
                              <Clock size={24} className="opacity-40" />
                              <span className="text-[10px]">Indisponible</span>
                            </>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <p className="text-slate-400 text-xs italic">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
