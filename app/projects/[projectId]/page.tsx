import Link from "next/link";
import { projectSections } from "@/lib/sample-data";

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
        Work through the tariff methodology from source inputs to reports. Calculation
        logic will be added in a later phase.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {projectSections.map((section) => (
          <Link
            key={section.href}
            href={`/projects/${projectId}/${section.href}`}
            className="rounded-md border border-line bg-white p-5 shadow-sm hover:border-semarts"
          >
            <h3 className="font-semibold">{section.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/70">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
