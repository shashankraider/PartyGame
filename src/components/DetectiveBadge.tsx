export function DetectiveBadge({ name, seat, observer = false }: { name: string; seat?: number | null; observer?: boolean }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join("").toUpperCase();
  return <span className={`detective-badge${observer ? " detective-badge--observer" : ""}`} aria-hidden="true"><span>{initials || "?"}</span><small>{observer ? "GUEST" : `DET / ${String(seat ?? 0).padStart(2, "0")}`}</small></span>;
}
