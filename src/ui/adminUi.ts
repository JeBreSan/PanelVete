export const ui = {
  page: { padding: 20 },

  h1: { fontSize: 22, fontWeight: 900 as const, margin: 0 },
  h2: { fontSize: 18, fontWeight: 900 as const, margin: 0 },
  sub: { opacity: 0.85, fontWeight: 800 as const, marginTop: 6 },

  card: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  } as const,

  cardInner: { padding: 14 } as const,

  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.22)",
    color: "#fff",
    padding: "0 12px",
    outline: "none",
    fontWeight: 800,
  } as const,

  textarea: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.22)",
    color: "#fff",
    padding: 12,
    outline: "none",
    fontWeight: 800,
  } as const,

  // ✅ Botón “tipo Editar usuarios” (morado→turquesa)
  btn: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "linear-gradient(90deg, rgba(136,92,255,0.95), rgba(40,207,196,0.92))",
    color: "#0b1020",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
    transition: "transform .12s ease, filter .12s ease",
  } as const,

  btnGhost: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    transition: "transform .12s ease, filter .12s ease",
  } as const,

  btnDanger: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,140,140,0.22)",
    background: "rgba(255,80,80,0.18)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as const,

  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.20)",
    fontWeight: 900,
  } as const,

  // ✅ Modal bonito (no negro feo)
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(8,10,18,0.62)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },

  modal: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "linear-gradient(180deg, rgba(34,48,92,0.92), rgba(22,26,50,0.92))",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    overflow: "hidden",
  } as const,

  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  } as const,

  modalBody: { padding: 14 } as const,

  toast: {
    position: "fixed" as const,
    top: 16,
    right: 16,
    zIndex: 80,
    maxWidth: 520,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(10,12,22,0.72)",
    padding: "12px 14px",
    boxShadow: "0 16px 50px rgba(0,0,0,0.35)",
    fontWeight: 800,
  } as const,
};