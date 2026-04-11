import { SearchFormWrapper } from "@/components/search-form/search-form-wrapper";

export const revalidate = 86400; // revalide le cache 1 fois par jour

export default function Home() {
  return (
    <div className="flex min-h-dvh w-full flex-col px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <main className="flex-1 space-y-6">
        <SearchFormWrapper />
      </main>
    </div>
  );
}
