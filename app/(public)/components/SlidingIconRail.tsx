const capabilities = [
  ["sensor", "Environmental light sensing"],
  ["control", "Control boxes"],
  ["survey", "Site assessment"],
  ["safety", "Safer field operation"],
  ["install", "Commissioning and handover"],
  ["energy", "Energy discipline"]
];

export function SlidingIconRail() {
  const items = [...capabilities, ...capabilities];

  return (
    <div className="ves-icon-marquee" aria-label="VES capabilities">
      <div className="ves-icon-track py-5">
        {items.map(([icon, label], index) => (
          <div className="mx-3 flex min-w-[260px] items-center gap-4 rounded border border-ves-leaf/25 bg-ves-deep px-5 py-4 shadow-[0_12px_34px_rgba(8,11,10,0.22)]" key={`${icon}-${index}`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded bg-ves-lime/12 text-ves-lime">
              <RailIcon name={icon} />
            </span>
            <span className="font-extrabold text-ves-paper">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RailIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2
  };

  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      {name === "sensor" ? (
        <>
          <path {...common} d="M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z" />
          <path {...common} d="M9 10a3 3 0 0 0 6 0" />
        </>
      ) : name === "control" ? (
        <>
          <rect {...common} x="5" y="4" width="14" height="16" rx="2" />
          <path {...common} d="M9 9h6M9 13h6M10 17h4" />
        </>
      ) : name === "survey" ? (
        <>
          <path {...common} d="M4 19V5l5 2 6-2 5 2v14l-5-2-6 2-5-2Z" />
          <path {...common} d="M9 7v14M15 5v14" />
        </>
      ) : name === "safety" ? (
        <>
          <path {...common} d="M12 3 5 6v5c0 4.5 2.9 8.3 7 10 4.1-1.7 7-5.5 7-10V6l-7-3Z" />
          <path {...common} d="m9 12 2 2 4-5" />
        </>
      ) : name === "install" ? (
        <>
          <path {...common} d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5" />
          <path {...common} d="m15 5 4 4" />
        </>
      ) : (
        <path {...common} d="M13 2 5 14h6l-1 8 9-13h-6l1-7Z" />
      )}
    </svg>
  );
}
