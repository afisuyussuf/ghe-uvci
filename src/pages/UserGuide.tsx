import { motion } from 'motion/react';
import { 
  Book, 
  Users, 
  Clock, 
  FileText, 
  CreditCard, 
  Settings, 
  Shield, 
  HelpCircle,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Bell,
  PenTool
} from 'lucide-react';

export default function UserGuide() {
  const sections = [
    {
      id: 'intro',
      title: 'Introduction',
      icon: Info,
      content: (
        <div className="space-y-4">
          <p>
            Bienvenue dans le guide d'utilisation de <strong>GHE UVCI</strong> (Gestion des Heures d'Enseignement). 
            Cette plateforme est conçue pour simplifier la gestion, le suivi et le paiement des heures d'enseignement 
            au sein de l'Université Virtuelle de Côte d'Ivoire.
          </p>
          <div className="bg-uvci-purple/5 p-4 rounded-xl border border-uvci-purple/10">
            <h4 className="font-bold text-uvci-purple flex items-center gap-2 mb-2">
              <Shield size={18} /> Rôles et Accès
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
              <li><strong>Administrateur :</strong> Accès complet au système, gestion des utilisateurs et paramètres.</li>
              <li><strong>Secrétaire :</strong> Gestion des enseignants, cours et validation des activités.</li>
              <li><strong>Enseignant :</strong> Déclaration des activités, consultation des états d'heures et paiements.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'enseignants',
      title: 'Gestion des Enseignants',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>Cette section permet de gérer la base de données des enseignants.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <h5 className="font-bold mb-2 flex items-center gap-2 text-slate-800">
                <CheckCircle2 size={16} className="text-green-500" /> Ajout d'un enseignant
              </h5>
              <p className="text-sm text-slate-500">
                Cliquez sur "Ajouter un enseignant" et remplissez les informations personnelles, 
                le grade et les coordonnées bancaires.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <h5 className="font-bold mb-2 flex items-center gap-2 text-slate-800">
                <CheckCircle2 size={16} className="text-green-500" /> Fiche Individuelle
              </h5>
              <p className="text-sm text-slate-500">
                Générez un récapitulatif PDF complet pour chaque enseignant incluant ses activités validées et son bilan financier.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <h5 className="font-bold mb-2 flex items-center gap-2 text-slate-800">
                <CheckCircle2 size={16} className="text-green-500" /> Importation groupée
              </h5>
              <p className="text-sm text-slate-500">
                Utilisez la fonction d'importation Excel pour ajouter plusieurs enseignants à la fois 
                en respectant le modèle fourni.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'activites',
      title: 'Suivi des Activités',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>Le cœur du système repose sur la déclaration et la validation des activités d'enseignement.</p>
          <div className="space-y-3">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-uvci-purple text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div>
                <h5 className="font-bold text-slate-800">Déclaration</h5>
                <p className="text-sm text-slate-500">L'enseignant ou le secrétaire saisit les détails de la séance (date, cours, type d'activité, durée).</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-uvci-purple text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div>
                <h5 className="font-bold text-slate-800">Validation et Soumission</h5>
                <p className="text-sm text-slate-500">L'enseignant doit <strong>soumettre</strong> son activité après la saisie. Le secrétaire ou l'administrateur valide ensuite l'activité pour qu'elle puisse être incluse dans l'état d'heures du mois.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-uvci-purple text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div>
                <h5 className="font-bold text-slate-800">Calcul automatique</h5>
                <p className="text-sm text-slate-500">
                  Le système calcule automatiquement le volume horaire et le montant dû en fonction des barèmes (coefficients) configurés et du grade de l'enseignant.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'etats',
      title: 'États d\'heures et Rapports',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>Générez des documents officiels en quelques clics.</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-sm text-slate-600">
              <ChevronRight size={14} className="text-uvci-purple" />
              <strong>États individuels :</strong> Récapitulatif des heures pour un enseignant spécifique.
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-600">
              <ChevronRight size={14} className="text-uvci-purple" />
              <strong>États collectifs :</strong> Vue d'ensemble pour un département ou une période.
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-600">
              <ChevronRight size={14} className="text-uvci-purple" />
              <strong>Export PDF/Excel :</strong> Téléchargez les rapports pour archivage ou signature.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'paiements',
      title: 'Gestion des Paiements',
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p>Suivez l'évolution des règlements financiers.</p>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Note :</strong> Un paiement ne peut être enregistré que pour des activités validées. 
              Vous pouvez effectuer des paiements partiels ou totaux.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'Système de Notifications',
      icon: Bell,
      content: (
        <div className="space-y-4">
          <p>Restez informé en temps réel des actions importantes sur la plateforme.</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-sm text-slate-600">
              <ChevronRight size={14} className="text-uvci-purple" />
              <strong>Alertes visuelles :</strong> Un badge rouge sur l'icône de cloche indique des notifications non lues.
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-600">
              <ChevronRight size={14} className="text-uvci-purple" />
              <strong>Types d'alertes :</strong> Soumission d'activités (pour le staff), validation ou rejet (pour les enseignants).
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-600">
              <ChevronRight size={14} className="text-uvci-purple" />
              <strong>Gestion :</strong> Marquez les notifications comme lues individuellement ou tout d'un coup.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Paramétrage Système',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p>La configuration du système est cruciale pour le bon fonctionnement des calculs.</p>
          <ul className="space-y-3">
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle2 size={14} className="text-uvci-purple" />
              </div>
              <div>
                <span className="font-bold text-slate-800">Barèmes (Coefficients) :</span>
                <p className="text-sm text-slate-500">Définissez les coefficients multiplicateurs par type d'action (CM, TD, TP, etc.) et niveau de complexité.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle2 size={14} className="text-uvci-purple" />
              </div>
              <div>
                <span className="font-bold text-slate-800">Semestres :</span>
                <p className="text-sm text-slate-500">Gérez les périodes académiques pour une meilleure organisation des cours.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle2 size={14} className="text-uvci-purple" />
              </div>
              <div>
                <span className="font-bold text-slate-800">Charge Horaire :</span>
                <p className="text-sm text-slate-500">Configurez la charge horaire annuelle réglementaire (ex: 192h) pour le calcul des heures complémentaires.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-1">
                <PenTool size={14} className="text-uvci-purple" />
              </div>
              <div>
                <span className="font-bold text-slate-800">Signature Numérique :</span>
                <p className="text-sm text-slate-500">Téléchargez une signature officielle qui sera automatiquement apposée sur les fiches individuelles et rapports PDF.</p>
              </div>
            </li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Guide d'Utilisation</h1>
          <p className="text-slate-500 mt-1">Tout ce que vous devez savoir pour maîtriser GHE UVCI</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          <HelpCircle className="text-uvci-purple" size={20} />
          <span className="text-sm font-medium text-slate-600">Besoin d'aide supplémentaire ?</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Rapide */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-4">Sommaire</h3>
            {sections.map((section) => (
              <a 
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-white hover:text-uvci-purple hover:shadow-sm transition-all group"
              >
                <section.icon size={18} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{section.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="lg:col-span-3 space-y-12">
          {sections.map((section, index) => (
            <motion.section 
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 scroll-mt-24"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-uvci-purple/10 text-uvci-purple flex items-center justify-center">
                  <section.icon size={24} />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900">{section.title}</h2>
              </div>
              <div className="text-slate-600 leading-relaxed">
                {section.content}
              </div>
            </motion.section>
          ))}

          {/* FAQ / Footer */}
          <section className="bg-slate-900 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <HelpCircle size={24} />
              </div>
              <h2 className="text-2xl font-display font-bold">Foire Aux Questions</h2>
            </div>
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-6">
                <h4 className="font-bold mb-2">Comment modifier mon mot de passe ?</h4>
                <p className="text-slate-400 text-sm">Allez dans "Paramètres" puis dans l'onglet "Sécurité" pour mettre à jour vos identifiants.</p>
              </div>
              <div className="border-b border-white/10 pb-6">
                <h4 className="font-bold mb-2">Que faire si une activité est rejetée ?</h4>
                <p className="text-slate-400 text-sm">Consultez le motif du rejet dans l'historique des activités, apportez les corrections nécessaires et soumettez-la à nouveau.</p>
              </div>
              <div>
                <h4 className="font-bold mb-2">Comment contacter le support technique ?</h4>
                <p className="text-slate-400 text-sm">Envoyez un email à support@uvci.edu.ci ou utilisez le système de ticket interne si disponible.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
