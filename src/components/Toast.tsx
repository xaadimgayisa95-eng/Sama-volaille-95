export default function Toast({ message }: { message: string }) {
  const show = !!message;
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-5 py-3 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all duration-300 z-[100] whitespace-nowrap shadow-lg ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}
