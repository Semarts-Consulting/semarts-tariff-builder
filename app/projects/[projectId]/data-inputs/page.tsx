import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { SectionHeader } from "@/components/SectionHeader";

export default function DataInputsPage() {
  return (
    <div>
      <SectionHeader
        title="Data inputs"
        description="Placeholder for the source data currently entered into the Excel tariff model."
      />
      <PlaceholderPanel
        title="Planned MVP inputs"
        items={[
          "Customer classes and customer counts",
          "Forecast annual consumption in kWh",
          "Forecast demand in kW or kVA",
          "Billing periods and effective dates",
          "Manual entry first, dataset upload later"
        ]}
      />
    </div>
  );
}
