export default function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
    pending: 'bg-orange-100 text-orange-800',
    reviewed: 'bg-blue-100 text-blue-800',
    resolved: 'bg-gray-100 text-gray-800',
  };
  const labels: Record<string, string> = {
    available: 'Disponible',
    reserved: 'Réservé',
    sold: 'Vendu',
    pending: 'En attente',
    reviewed: 'Examiné',
    resolved: 'Résolu',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}
