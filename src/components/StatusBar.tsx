import { useState, useEffect } from 'react';

export default function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-11 bg-[#133D15] flex items-center justify-between px-5 shrink-0">
      <span className="text-white text-xs font-semibold">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <div className="flex items-center gap-1.5 text-white text-xs">
        <span>_signal</span>
        <span>wifi</span>
        <span>battery</span>
      </div>
    </div>
  );
}
