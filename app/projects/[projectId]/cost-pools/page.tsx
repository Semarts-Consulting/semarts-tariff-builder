import { SectionHeader } from "@/components/SectionHeader";
import { WorkbookCostInputsForm, type CostInputSection } from "@/components/WorkbookMethodologyForms";

const sectionCopy: Record<CostInputSection, { title: string; description: string }> = {
  "direct-non-employee": {
    title: "Direct - Non-Employee",
    description: "Capture direct non-employee cost inputs from Inputs and Selections."
  },
  "direct-employee": {
    title: "Direct - Employee",
    description: "Capture direct employee role, FTE, time and rate inputs."
  },
  "indirect-overheads": {
    title: "Indirect Overheads",
    description: "Capture central overhead inputs and supporting assumptions."
  },
  "transmission-distribution": {
    title: "Transmission & Distribution",
    description: "Capture MPAN-level transmission and distribution charging inputs."
  },
  "supply-contract": {
    title: "Supply Contract",
    description: "Capture supply contract, admin and margin inputs."
  },
  "asset-data": {
    title: "Asset Data",
    description: "Capture asset register inputs."
  }
};

function getSection(value: string | string[] | undefined): CostInputSection {
  if (
    value === "direct-employee" ||
    value === "indirect-overheads" ||
    value === "transmission-distribution" ||
    value === "supply-contract"
  ) {
    return value;
  }

  return "direct-non-employee";
}

export default async function CostPoolsPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { projectId } = await params;
  const { section: rawSection } = await searchParams;
  const section = getSection(rawSection);

  return (
    <div>
      <SectionHeader
        title={sectionCopy[section].title}
        description={sectionCopy[section].description}
      />
      <WorkbookCostInputsForm projectId={projectId} section={section} />
    </div>
  );
}
