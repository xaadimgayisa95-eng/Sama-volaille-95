import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { getAppSettings } from '../lib/settings';

// Compact, collapsed-by-default upsell for featuring a listing. Deliberately
// small (a pill, not a banner) so it doesn't dominate the page — it only
// expands to show the payment options when the owner taps it.
export default function FeatureListingPrompt({ listingId, listingTitle }: {
  listingId: string;
  listingTitle: string;
}) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  useEffect(() => { getAppSettings().then(setSettings); }, []);

  const price = settings.featured_price || '1000';
  const waveLink = settings.wave_link;
  const omNumber = settings.orange_money_number;
  const waNumber = settings.whatsapp_number?.replace(/[^0-9]/g, '');
  const confirmLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Bonjour, je viens de payer pour mettre en avant mon annonce "${listingTitle}" (ID: ${listingId}). Voici la preuve de paiement.`
      )}`
    : '';

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#946200] bg-[#F5C518]/20 px-2.5 py-1.5 rounded-full"
      >
        <Star className="w-3.5 h-3.5 fill-current text-[#F5C518]" />
        Mettre en avant — {price} F CFA
      </button>

      {open && (
        <div className="mt-2 bg-gray-50 rounded-lg p-3 space-y-2.5">
          <div className="flex gap-2">
            {waveLink && (
              <a href={waveLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-[#1DC8CA] text-white rounded-lg py-2 text-sm font-bold">
                Payer avec Wave
              </a>
            )}
            {omNumber && (
              <a href={`tel:${omNumber}`} className="flex-1 flex flex-col items-center justify-center bg-orange-50 border border-orange-200 rounded-lg py-1.5">
                <span className="text-[10px] text-orange-700 font-semibold">Orange Money</span>
                <span className="text-orange-700 font-bold text-sm">{omNumber}</span>
              </a>
            )}
          </div>
          {confirmLink && (
            <a href={confirmLink} target="_blank" rel="noopener noreferrer" className="block text-center text-[#25D366] text-xs font-semibold underline">
              Après paiement, confirmez via WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
