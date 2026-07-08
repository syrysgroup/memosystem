// Hex values pulled from the ECOWAS secondary palette (globals.css) — used
// as inline styles since Tailwind can't pick up dynamically-built class
// names like `bg-${color}` at build time.
const COLORS = ["#008244", "#ad4f2e", "#004c71", "#335d68", "#8e1d36", "#f07e26", "#aebd39", "#5ea3b3"];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/);
  const chars = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
  return chars.toUpperCase();
}

export function Avatar({
  name,
  shape = "circle",
  size = 40,
  photoUrl,
}: {
  name: string;
  shape?: "circle" | "square";
  size?: number;
  photoUrl?: string | null;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire, so a static <Image> optimization cache would go stale
      <img
        src={photoUrl}
        alt={name}
        className={`shrink-0 object-cover ${shape === "circle" ? "rounded-full" : "rounded-md"}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold text-white ${shape === "circle" ? "rounded-full" : "rounded-md"}`}
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: colorFor(name) }}
    >
      {shape === "square" ? "#" : initialsFor(name)}
    </div>
  );
}
