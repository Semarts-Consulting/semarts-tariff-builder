type SectionHeaderProps = {
  title: string;
  description: string;
};

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-ink/70">{description}</p>
    </div>
  );
}
