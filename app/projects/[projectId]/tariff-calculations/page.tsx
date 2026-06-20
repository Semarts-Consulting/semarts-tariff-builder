import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { SectionHeader } from "@/components/SectionHeader";

export default function TariffCalculationsPage() {
  return (
    <div>
      <SectionHeader
        title="Tariff calculations"
        description="Placeholder for the future calculation engine. No calculation logic is implemented yet."
      />
      <PlaceholderPanel
        title="Future calculation areas"
        items={[
          "Revenue requirement calculation",
          "Cost allocation by customer class",
          "Fixed, energy, and demand charge calculation",
          "Pass-through charge calculation",
          "Revenue reconciliation and variance checks"
        ]}
      />
    </div>
  );
}
