export default function NewProjectPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">New project</h1>
      <p className="mt-2 text-ink/70">
        Capture the basic project details before adding tariff inputs and methodology rules.
      </p>

      <form className="mt-8 space-y-5 rounded-md border border-line bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium">Project name</span>
          <input
            type="text"
            placeholder="2026 Private Network Tariff Review"
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Network name</span>
          <input
            type="text"
            placeholder="Semarts Private Electricity Network"
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Tariff year</span>
            <input
              type="number"
              placeholder="2026"
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Effective date</span>
            <input
              type="date"
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
        </div>
        <button
          type="button"
          className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark"
        >
          Save draft
        </button>
      </form>
    </section>
  );
}
