import Image from "next/image";

const SUBLINE = ["ECOWAS COMMISSION", "COMMISSION DE LA CEDEAO", "COMISSÃO DA CEDEAO"];

/**
 * Reproduces the ECOWAS Corporate Design Manual's logo lockup: badge and
 * subline must never be separated (manual, "1 | ECOWAS Logo", p.5).
 */
export function Logo({
  size = 44,
  align = "left",
  className = "",
}: {
  size?: number;
  align?: "left" | "center";
  className?: string;
}) {
  const fontSize = Math.round(size * 0.23);
  const text = (
    <div className={`leading-[1.15] ${align === "center" ? "text-center" : ""}`}>
      {SUBLINE.map((line) => (
        <div key={line} className="font-bold text-ecowas-green" style={{ fontSize }}>
          {line}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`flex ${align === "center" ? "flex-col items-center gap-1.5" : "flex-row items-center gap-3"} ${className}`}
    >
      <Image
        src="/brand/ecowas-badge.png"
        alt="ECOWAS"
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      {text}
    </div>
  );
}
