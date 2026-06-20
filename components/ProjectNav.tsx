import Link from "next/link";
import { projectSections } from "@/lib/sample-data";

type ProjectNavProps = {
  projectId: string;
};

export function ProjectNav({ projectId }: ProjectNavProps) {
  return (
    <nav className="mt-8 flex flex-wrap gap-2">
      <Link
        href={`/projects/${projectId}`}
        className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:border-semarts"
      >
        Dashboard
      </Link>
      {projectSections.map((section) => (
        <Link
          key={section.href}
          href={`/projects/${projectId}/${section.href}`}
          className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium hover:border-semarts"
        >
          {section.title}
        </Link>
      ))}
    </nav>
  );
}
