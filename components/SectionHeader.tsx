type SectionHeaderProps = {
  title: string;
  description: string;
};

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70 sm:text-base">
        {description}
      </p>
    </div>
  );
}
