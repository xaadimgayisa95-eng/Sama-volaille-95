// Per-category listing attributes, tailored to how poultry is actually
// traded in Senegal (local vs. industrial breeds, Newcastle vaccination,
// fertile vs. table eggs, new vs. used equipment, feed stage/bag size).
// Keyed by category slug (src/screens/PublishScreen.tsx looks this up
// after the seller picks a category); stored as free-form JSONB on
// listings.attributes so adding a field never needs a migration.

export type FieldType = 'select' | 'text' | 'number' | 'boolean' | 'date';

export interface CategoryField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}

export const CATEGORY_FIELDS: Record<string, CategoryField[]> = {
  poussins: [
    { key: 'age', label: 'Âge', type: 'select', options: ['1 jour', '1 semaine', '2-3 semaines', '1 mois et +'] },
    { key: 'race', label: 'Race', type: 'select', options: ['Poulet local', 'Sasso', 'Cobb 500', 'Leghorn', 'Isa Brown', 'Autre'] },
    { key: 'vaccine_newcastle', label: 'Vacciné contre la maladie de Newcastle', type: 'boolean' },
  ],
  poulets: [
    { key: 'race', label: 'Race', type: 'select', options: ['Poulet local / bicyclette', 'Sasso', 'Cobb 500', 'Leghorn', 'Isa Brown', 'Autre'] },
    { key: 'type_elevage', label: 'Type', type: 'select', options: ['Chair', 'Pondeuse'] },
    { key: 'poids_kg', label: 'Poids approximatif (kg)', type: 'number', placeholder: 'Ex: 2.5' },
    { key: 'vaccine_newcastle', label: 'Vacciné contre la maladie de Newcastle', type: 'boolean' },
  ],
  dindes: [
    { key: 'age_mois', label: 'Âge (mois)', type: 'number', placeholder: 'Ex: 4' },
    { key: 'poids_kg', label: 'Poids approximatif (kg)', type: 'number', placeholder: 'Ex: 6' },
  ],
  pintades: [
    { key: 'type_elevage', label: 'Type', type: 'select', options: ['Locale', 'Améliorée'] },
    { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 3 mois' },
  ],
  'canards-oies': [
    { key: 'espece', label: 'Espèce', type: 'select', options: ['Canard', 'Oie'] },
    { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex: 2 mois' },
    { key: 'poids_kg', label: 'Poids approximatif (kg)', type: 'number' },
  ],
  pigeons: [
    { key: 'usage', label: 'Usage', type: 'select', options: ['Chair', 'Reproduction / Course'] },
    { key: 'age', label: 'Âge', type: 'text' },
  ],
  cailles: [
    { key: 'usage', label: 'Usage', type: 'select', options: ['Chair', 'Ponte', 'Reproduction'] },
    { key: 'age', label: 'Âge', type: 'text' },
  ],
  oeufs: [
    { key: 'type_oeuf', label: "Type d'œufs", type: 'select', options: ['Œufs à couver (fécondés)', 'Œufs de consommation'] },
    { key: 'race_mere', label: 'Race de la poule mère (si fécondés)', type: 'text', placeholder: 'Ex: Sasso' },
    { key: 'quantite', label: "Nombre d'œufs par lot", type: 'number', placeholder: 'Ex: 30' },
  ],
  'materiel-elevage': [
    { key: 'type_materiel', label: 'Type de matériel', type: 'select', options: ['Couveuse / Incubateur', 'Mangeoire', 'Abreuvoir', 'Éleveuse / Chauffage', 'Cage', 'Autre'] },
    { key: 'etat', label: 'État', type: 'select', options: ['Neuf', 'Occasion - bon état', 'Occasion - à réviser'] },
    { key: 'capacite', label: 'Capacité (si applicable)', type: 'text', placeholder: "Ex: 100 œufs" },
  ],
  'produits-veterinaires': [
    { key: 'type_produit', label: 'Type de produit', type: 'select', options: ['Vaccin', 'Antiparasitaire / Déparasitant', 'Vitamines / Complément', 'Antibiotique', 'Autre'] },
    { key: 'date_expiration', label: "Date d'expiration", type: 'date' },
  ],
  aliments: [
    { key: 'type_aliment', label: "Type d'aliment", type: 'select', options: ['Démarrage', 'Croissance', 'Ponte', 'Chair / Finition', 'Autre'] },
    { key: 'poids_sac', label: 'Poids du sac', type: 'select', options: ['1 kg', '5 kg', '25 kg', '50 kg', 'Autre'] },
    { key: 'marque', label: 'Marque', type: 'text' },
  ],
};
