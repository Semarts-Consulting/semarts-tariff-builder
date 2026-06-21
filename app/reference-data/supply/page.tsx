import { SupplyReferenceDataForm } from "@/components/SupplyReferenceDataForm";

export default function SupplyReferenceDataPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="border-b border-line pb-6">
        <p className="text-sm font-medium text-semarts-dark">Reference Data</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Supply Reference Data
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70">
          Maintain universal MPAN, DNO and LC14 source information used across tariff models.
        </p>
      </div>
      <div className="py-6 sm:py-8">
        <SupplyReferenceDataForm />
      </div>
    </section>
  );
}
