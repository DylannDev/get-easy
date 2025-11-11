import { SearchForm } from "@/components/search-form/search-form";

export default function Home() {
  return (
    <div className="flex min-h-dvh w-full flex-col px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <main className="flex-1 space-y-6">
        <SearchForm />
      </main>
    </div>
  );
}
