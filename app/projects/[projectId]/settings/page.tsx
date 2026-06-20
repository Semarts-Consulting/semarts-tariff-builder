import { ProjectSettingsForm } from "@/components/ProjectSettingsForm";
import { SectionHeader } from "@/components/SectionHeader";
import { WorkbookAssumptionsForm } from "@/components/WorkbookMethodologyForms";

export default async function ProjectSettingsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <SectionHeader
        title="Settings"
        description="Edit project details, update status, archive, or delete the project."
      />
      <ProjectSettingsForm projectId={projectId} />
      <div className="mt-6">
        <WorkbookAssumptionsForm projectId={projectId} />
      </div>
    </div>
  );
}
