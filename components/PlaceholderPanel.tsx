type PlaceholderPanelProps = {
  title: string;
  items: string[];
};

export function PlaceholderPanel({ title, items }: PlaceholderPanelProps) {
  return (
    <div className="mt-8 rounded-md border border-line bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/70 md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="border-l-2 border-semarts/40 pl-3">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
