import { useState, useEffect } from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';

export default function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-11 bg-[#133D15] flex items-center justify-between px-5 shrink-0">
      <span className="text-white text-xs font-semibold">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <div className="flex items-center gap-1.5">
        <Signal className="w-3.5 h-3.5 text-white" />
        <Wifi className="w-3.5 h-3.5 text-white" />
        <BatteryFull className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}
