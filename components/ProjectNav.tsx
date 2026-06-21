"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type ProjectNavProps = {
  projectId: string;
};

const outputSections = [
  { title: "Dashboard", href: "" },
  { title: "Settings", href: "settings" },
  { title: "Reports", href: "reports" }
];

const modelSections = [
  {
    title: "Data Inputs",
    href: "data-inputs",
    items: [
      { title: "Selections", section: "selections" },
      { title: "Boundary Meter Data", section: "boundary-meter-data" },
      { title: "Asset Data", section: "asset-data" }
    ]
  },
  {
    title: "Cost Inputs",
    href: "cost-pools",
    items: [
      { title: "Direct - Non-Employee", section: "direct-non-employee" },
      { title: "Direct - Employee", section: "direct-employee" },
      { title: "Indirect Overheads", section: "indirect-overheads" },
      { title: "Transmission & Distribution", section: "transmission-distribution" },
      { title: "Supply Contract", section: "supply-contract" }
    ]
  },
  { title: "Allocation Methods", href: "allocation-methods", items: [] },
  { title: "Tariff Calculations", href: "tariff-calculations", items: [] }
];

function navClass(isActive: boolean) {
  return `shrink-0 rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap ${
    isActive
      ? "border-semarts bg-semarts text-white"
      : "border-line bg-white hover:border-semarts"
  }`;
}

function subNavClass(isActive: boolean) {
  return `shrink-0 rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap ${
    isActive
      ? "border-semarts bg-field text-semarts-dark"
      : "border-line bg-white hover:border-semarts"
  }`;
}

export function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeModelSection = modelSections.find((section) =>
    pathname.endsWith(`/${section.href}`)
  );
  const activeSubsection = searchParams.get("section");

  return (
    <nav className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
      <div className="-mx-4 overflow-x-auto border-b border-line px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2">
        {outputSections.map((section) => {
          const href = section.href ? `/projects/${projectId}/${section.href}` : `/projects/${projectId}`;
          const isActive = section.href
            ? pathname.endsWith(`/${section.href}`)
            : pathname === `/projects/${projectId}`;

          return (
            <Link
              key={section.title}
              href={href}
              className={navClass(isActive)}
              aria-current={isActive ? "page" : undefined}
            >
              {section.title}
            </Link>
          );
        })}
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2">
        {modelSections.map((section) => {
          const href =
            section.items.length > 0
              ? `/projects/${projectId}/${section.href}?section=${section.items[0].section}`
              : `/projects/${projectId}/${section.href}`;
          const isActive = pathname.endsWith(`/${section.href}`);

          return (
            <Link
              key={section.href}
              href={href}
              className={navClass(isActive)}
              aria-current={isActive ? "page" : undefined}
            >
              {section.title}
            </Link>
          );
        })}
        </div>
      </div>

      {activeModelSection && activeModelSection.items.length > 0 ? (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2 rounded-md border border-line bg-white p-3">
          {activeModelSection.items.map((item) => {
            const isActive =
              activeSubsection === item.section ||
              (!activeSubsection && item.section === activeModelSection.items[0].section);

            return (
              <Link
                key={item.section}
                href={`/projects/${projectId}/${activeModelSection.href}?section=${item.section}`}
                className={subNavClass(isActive)}
                aria-current={isActive ? "page" : undefined}
              >
                {item.title}
              </Link>
            );
          })}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
