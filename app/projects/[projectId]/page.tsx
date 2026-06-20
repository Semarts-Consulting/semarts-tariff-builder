import { ProjectDashboardOverview } from "@/components/ProjectDashboardOverview";

export default async function ProjectDashboardPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Project dashboard</h2>
      <p className="mt-2 max-w-3xl text-ink/70">
        Track readiness across inputs, recoverable costs, allocation methods, tariff
        calculations, and reports.
      </p>

      <ProjectDashboardOverview projectId={projectId} />
    </div>
  );
}
