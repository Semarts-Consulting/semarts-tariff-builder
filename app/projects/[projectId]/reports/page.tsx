import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { SectionHeader } from "@/components/SectionHeader";

export default function ReportsPage() {
  return (
    <div>
      <SectionHeader
        title="Reports"
        description="Placeholder for outputs that replace manually formatted Excel schedules and methodology notes."
      />
      <PlaceholderPanel
        title="Planned MVP reports"
        items={[
          "Tariff schedule",
          "Methodology summary",
          "Revenue reconciliation summary",
          "Scenario summary",
          "Calculation warnings and assumptions"
        ]}
      />
    </div>
  );
}
