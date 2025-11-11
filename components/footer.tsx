export const Footer = () => {
  return (
    <footer className="mt-10 bg-gray-900 py-8 text-gray-100">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="text-lg font-semibold">AutoRent</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded bg-gray-800 px-3 py-1">CB</span>
          <span className="rounded bg-gray-800 px-3 py-1">Visa</span>
          <span className="rounded bg-gray-800 px-3 py-1">Stripe</span>
        </div>
      </div>
    </footer>
  );
};
