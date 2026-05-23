import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Bienvenue sur GHE UVCI",
    description: "La plateforme officielle de gestion des heures d'enseignement de l'Université Virtuelle de Côte d'Ivoire.",
    image: "https://lh3.googleusercontent.com/u/0/d/12qEcvTCVGr5cKMXWjBzHGs8v5Jnd7c7K",
    color: "bg-uvci-purple"
  },
  {
    title: "Gestion Simplifiée",
    description: "Saisissez vos activités pédagogiques selon les coefficients officiels.",
    image: "https://lh3.googleusercontent.com/u/0/d/17Lneh_BwM7CDzCizNsdb7QFu0tj07mc2",
    color: "bg-uvci-green"
  },
  {
    title: "Transparence Totale",
    description: "Consultez vos états d'heures et suivez vos paiements en un clic.",
    image: "https://lh3.googleusercontent.com/u/0/d/1Euqd29YJ5H3BeLYxabcsFX-RWys1rzE9",
    color: "bg-uvci-purple"
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row h-[600px]"
      >
        <div className="md:w-1/2 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentStep}
              src={steps[currentStep].image}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className={`absolute inset-0 opacity-40 ${steps[currentStep].color}`} />
        </div>

        <div className="md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <div className="flex gap-2 mb-8">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep ? "w-8 bg-uvci-purple" : "w-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="space-y-4"
              >
                <h2 className="text-4xl font-display font-bold text-uvci-purple">
                  {steps[currentStep].title}
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={prev}
              disabled={currentStep === 0}
              className={`p-4 rounded-full transition-colors ${
                currentStep === 0 ? "text-slate-300" : "text-uvci-purple hover:bg-slate-100"
              }`}
            >
              <ChevronLeft size={32} />
            </button>

            <button
              onClick={next}
              className="btn btn-uvci-purple btn-lg rounded-full px-8 gap-2"
            >
              {currentStep === steps.length - 1 ? (
                <>Commencer <Check size={20} /></>
              ) : (
                <>Suivant <ChevronRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
