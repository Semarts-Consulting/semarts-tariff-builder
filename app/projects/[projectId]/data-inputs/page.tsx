import { SectionHeader } from "@/components/SectionHeader";
import {
  WorkbookAssumptionsForm,
  WorkbookBoundaryMeterDataForm,
  WorkbookCostInputsForm
} from "@/components/WorkbookMethodologyForms";

type DataInputSection = "selections" | "boundary-meter-data" | "asset-data";

const sectionCopy: Record<DataInputSection, { title: string; description: string }> = {
  selections: {
    title: "Selections",
    description: "Capture the workbook methodology assumptions from Inputs and Selections."
  },
  "boundary-meter-data": {
    title: "Boundary meter data",
    description: "Prepare the half-hourly boundary meter import structure used by the workbook."
  },
  "asset-data": {
    title: "Asset data",
    description: "Capture the asset register that feeds annuity, depreciation and asset cost calculations."
  }
};

function getSection(value: string | string[] | undefined): DataInputSection {
  return value === "boundary-meter-data" || value === "asset-data" ? value : "selections";
}

export default async function DataInputsPage({
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
      {section === "selections" ? <WorkbookAssumptionsForm projectId={projectId} /> : null}
      {section === "boundary-meter-data" ? (
        <WorkbookBoundaryMeterDataForm projectId={projectId} />
      ) : null}
      {section === "asset-data" ? (
        <WorkbookCostInputsForm projectId={projectId} section="asset-data" />
      ) : null}
    </div>
  );
}
