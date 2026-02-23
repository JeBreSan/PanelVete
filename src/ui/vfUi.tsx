"use client";

import React, { useMemo, useState } from "react";

export const vf = {
  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.07)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties,

  cardStrong: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(20, 28, 60, 0.70)",
    boxShadow: "0 16px 45px rgba(0,0,0,0.28)",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties,

  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "#fff",
    padding: "0 12px",
    outline: "none",
    fontWeight: 800,
  } as React.CSSProperties,

  textarea: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "#fff",
    padding: 12,
    outline: "none",
    fontWeight: 800,
  } as React.CSSProperties,

  label: { fontWeight: 900, opacity: 0.95 } as React.CSSProperties,
  subtle: { opacity: 0.85, fontWeight: 800 } as React.CSSProperties,
};

export function VFCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <div style={{ ...vf.card, padding: 14, ...style }}>{children}</div>;
}

export function VFCardStrong({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <div style={{ ...vf.cardStrong, padding: 14, ...style }}>{children}</div>;
}

export function VFButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  style,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const [hover, setHover] = useState(false);

  const base: React.CSSProperties = {
    height: 44,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease, opacity .12s ease",
    transform: hover && !disabled ? "translateY(-1px)" : "translateY(0px)",
    opacity: disabled ? 0.65 : 1,
    userSelect: "none",
    outline: "none",
  };

  const v: React.CSSProperties =
    variant === "danger"
      ? {
          background: "linear-gradient(90deg, rgba(255,80,120,0.95), rgba(255,140,100,0.95))",
          boxShadow: hover ? "0 12px 28px rgba(255,90,120,0.22)" : "0 10px 22px rgba(0,0,0,0.18)",
        }
      : variant === "ghost"
      ? {
          background: "rgba(255,255,255,0.08)",
          boxShadow: hover ? "0 14px 30px rgba(0,0,0,0.18)" : "0 10px 22px rgba(0,0,0,0.12)",
        }
      : {
          background: "linear-gradient(90deg, rgba(139,92,246,0.95), rgba(45,212,191,0.95))",
          boxShadow: hover ? "0 14px 34px rgba(45,212,191,0.22)" : "0 10px 22px rgba(0,0,0,0.18)",
        };

  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...v, ...style }}
    >
      {children}
    </button>
  );
}

export function VFModal({
  open,
  title,
  onClose,
  children,
  maxWidth = 760,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.60)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          ...vf.cardStrong,
          padding: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>{title ?? ""}</div>
          <VFButton variant="ghost" onClick={onClose} style={{ height: 38, borderRadius: 12 }}>
            Cerrar
          </VFButton>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export function VFToast({
  show,
  text,
  kind = "ok",
}: {
  show: boolean;
  text: string;
  kind?: "ok" | "warn" | "err";
}) {
  const style = useMemo<React.CSSProperties>(() => {
    const bg =
      kind === "err"
        ? "rgba(255, 80, 120, 0.18)"
        : kind === "warn"
        ? "rgba(255, 210, 90, 0.18)"
        : "rgba(45, 212, 191, 0.16)";
    const br =
      kind === "err"
        ? "rgba(255, 80, 120, 0.30)"
        : kind === "warn"
        ? "rgba(255, 210, 90, 0.30)"
        : "rgba(45, 212, 191, 0.26)";
    return {
      padding: "10px 12px",
      borderRadius: 14,
      background: bg,
      border: `1px solid ${br}`,
      fontWeight: 900,
    };
  }, [kind]);

  if (!show) return null;
  return <div style={style}>{text}</div>;
}