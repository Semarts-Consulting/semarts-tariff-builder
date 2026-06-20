import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { SectionHeader } from "@/components/SectionHeader";

export default function AllocationMethodsPage() {
  return (
    <div>
      <SectionHeader
        title="Allocation methods"
        description="Placeholder for assigning cost pools to tariff classes and tariff components."
      />
      <PlaceholderPanel
        title="Planned MVP allocation rules"
        items={[
          "Allocation percentage by customer class",
          "Fixed, energy, and demand cost splits",
          "Customer-related allocation factors",
          "Energy-related allocation factors",
          "Demand-related allocation factors"
        ]}
      />
    </div>
  );
}
