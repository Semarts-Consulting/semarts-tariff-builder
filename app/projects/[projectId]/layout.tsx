import { ProjectNav } from "@/components/ProjectNav";
import { getProject } from "@/lib/sample-data";

export default async function ProjectLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  const project = getProject(projectId);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="border-b border-line pb-6">
        <p className="text-sm font-medium text-semarts-dark">{project.networkName}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
        <p className="mt-2 text-sm text-ink/60">
          Tariff year {project.tariffYear} - {project.status}
        </p>
        <ProjectNav projectId={projectId} />
      </div>
      <div className="py-8">{children}</div>
    </section>
  );
}
