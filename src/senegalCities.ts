// Senegal's 14 régions with their main towns/communes, for the "ville"
// dropdown on PublishScreen — sellers pick a real place instead of typing
// free text, so search/location filtering stays consistent later.

export const SENEGAL_CITIES: { region: string; cities: string[] }[] = [
  { region: 'Dakar', cities: ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Keur Massar', 'Bargny', 'Sébikotane'] },
  { region: 'Thiès', cities: ['Thiès', 'Mbour', 'Tivaouane', 'Joal-Fadiouth', 'Khombole', 'Pout', 'Saly'] },
  { region: 'Diourbel', cities: ['Diourbel', 'Touba', 'Mbacké', 'Bambey'] },
  { region: 'Fatick', cities: ['Fatick', 'Foundiougne', 'Gossas', 'Sokone'] },
  { region: 'Kaolack', cities: ['Kaolack', 'Guinguinéo', 'Nioro du Rip'] },
  { region: 'Kaffrine', cities: ['Kaffrine', 'Birkelane', 'Koungheul', 'Malem Hodar'] },
  { region: 'Kolda', cities: ['Kolda', 'Vélingara', 'Médina Yoro Foulah'] },
  { region: 'Sédhiou', cities: ['Sédhiou', 'Bounkiling', 'Goudomp'] },
  { region: 'Ziguinchor', cities: ['Ziguinchor', 'Bignona', 'Oussouye'] },
  { region: 'Louga', cities: ['Louga', 'Linguère', 'Kébémer'] },
  { region: 'Saint-Louis', cities: ['Saint-Louis', 'Richard-Toll', 'Dagana', 'Podor'] },
  { region: 'Matam', cities: ['Matam', 'Kanel', 'Ranérou'] },
  { region: 'Tambacounda', cities: ['Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum'] },
  { region: 'Kédougou', cities: ['Kédougou', 'Salémata', 'Saraya'] },
];
