import { NewProjectForm } from "@/components/NewProjectForm";

export default function NewProjectPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">New project</h1>
      <p className="mt-2 text-ink/70">
        Capture the basic project details before adding tariff inputs and methodology rules.
      </p>

      <NewProjectForm />
    </section>
  );
}
