import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { SectionHeader } from "@/components/SectionHeader";

export default function CostPoolsPage() {
  return (
    <div>
      <SectionHeader
        title="Cost pools"
        description="Placeholder for recoverable cost categories used to determine the private network revenue requirement."
      />
      <PlaceholderPanel
        title="Planned MVP cost pools"
        items={[
          "Operations and maintenance costs",
          "Network service and pass-through costs",
          "Administration costs",
          "Depreciation and asset-related allowances",
          "Taxes, levies, and other statutory charges"
        ]}
      />
    </div>
  );
}
