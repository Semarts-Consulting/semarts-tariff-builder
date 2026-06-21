import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-112px)] max-w-6xl content-center gap-8 px-4 py-10 sm:px-6 sm:py-16 md:min-h-[calc(100vh-73px)] md:grid-cols-[1.15fr_0.85fr] md:items-center">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-warm-gold">
          Private electricity networks
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-6xl">
          Semarts Tariff Methodology Builder
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 sm:mt-6 sm:text-lg sm:leading-8">
          Replace spreadsheet tariff models with a structured workspace for inputs,
          cost pools, allocation methods, calculations, and reports.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/projects/new"
            className="rounded-md bg-semarts px-5 py-3 text-center text-sm font-semibold text-white hover:bg-semarts-dark"
          >
            Create project
          </Link>
          <Link
            href="/projects"
            className="rounded-md border border-line bg-white px-5 py-3 text-center text-sm font-semibold text-ink hover:border-semarts"
          >
            View projects
          </Link>
        </div>
      </div>
      <div className="border-l-4 border-semarts bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-ink">MVP focus</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/70">
          <li>Project setup for one private network tariff methodology.</li>
          <li>Placeholder sections for the methodology workflow.</li>
          <li>Supabase-ready structure without authentication or calculations.</li>
        </ul>
      </div>
    </section>
  );
}
