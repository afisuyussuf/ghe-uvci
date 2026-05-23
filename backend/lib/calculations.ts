export const BAREME = {
  Conception: {
    N1: 0.40,
    N2: 0.75,
    N3: 1.50
  },
  MAJ: {
    N1: 0.20,
    N2: 0.375,
    N3: 0.75
  }
};

export function calculateVolumeHoraire(type_action: 'Conception' | 'MAJ', niveau_complexite: 'N1' | 'N2' | 'N3', nb_sequences: number) {
  const factor = BAREME[type_action]?.[niveau_complexite] || 0;
  return Number((factor * nb_sequences).toFixed(2));
}

export function calculateMontant(volume_horaire: number, taux_horaire: number) {
  return Math.round(volume_horaire * taux_horaire);
}
