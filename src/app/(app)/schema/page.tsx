import { schema } from "@/lib/data/schema";

const typeStyle: Record<string, { dot: string }> = {
  mat:       { dot: "#C8A84B" },
  aktivitet: { dot: "#3D6B3A" },
  dricka:    { dot: "#1B3F6E" },
  vila:      { dot: "#A8C5DA" },
  natt:      { dot: "#4A7FAD" },
};

export default function SchemaPage() {
  return (
    <div className="page-bg" style={{ paddingBottom: "48px" }}>
      <div style={{ padding: "32px 20px 20px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p className="page-subtitle">Kvällens program</p>
          <h1 className="page-title">Schema</h1>
          <div className="gold-rule" />
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "0 20px" }}>
        {schema.map((item, index) => {
          const ts = typeStyle[item.type] ?? typeStyle.aktivitet;
          const isLast = index === schema.length - 1;

          return (
            <div key={item.id} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: ts.dot, marginTop: "5px",
                  boxShadow: `0 0 0 3px rgba(255,255,255,0.8)`,
                }} />
                {!isLast && (
                  <div style={{ width: "1.5px", flex: 1, background: "var(--border)", minHeight: "28px", margin: "4px 0" }} />
                )}
              </div>

              <div style={{ flex: 1, paddingBottom: isLast ? 0 : "20px" }}>
                <p style={{
                  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                  fontSize: "11px", color: "var(--text-muted)",
                  margin: "0 0 2px", letterSpacing: "0.04em",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {item.time}
                </p>
                <p style={{
                  fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                  fontSize: "16px", color: "var(--blue-deep)",
                  margin: "0 0 3px", fontWeight: 400,
                }}>
                  {item.title}
                </p>
                {item.description && (
                  <p style={{
                    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                    fontSize: "12px", color: "var(--text-muted)",
                    margin: 0, lineHeight: 1.5,
                  }}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
