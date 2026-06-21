import { SupplyReferenceExtractionReview } from "@/components/SupplyReferenceExtractionReview";

export default function SupplyReferenceExtractionPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="border-b border-line pb-6">
        <p className="text-sm font-medium text-semarts-dark">Reference Data</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Extraction Staging</h1>
        <p className="mt-3 max-w-3xl text-sm text-ink/70">
          Review source documents and extracted TOU/loss candidates before Semarts approval.
        </p>
      </div>
      <div className="py-8">
        <SupplyReferenceExtractionReview />
      </div>
    </section>
  );
}
