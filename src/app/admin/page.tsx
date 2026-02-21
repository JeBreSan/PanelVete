"use client";

import { useMemo } from "react";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

function saludoPorRol(rol: string) {
  const r = (rol || "").toLowerCase();
  if (r === "admin") return "Hola Administrador";
  if (r === "doctor") return "Hola Doctor/Doctora";
  if (r === "staff" || r === "administrativo") return "Hola Administrativo/a";
  return "Hola";
}

export default function AdminHome() {
  const rol = useMemo(() => readCookie("vf_rol"), []);
  const nombre = useMemo(() => readCookie("vf_nombre"), []);

  return (
    <div>
      <h1>
        {saludoPorRol(rol)}
        {nombre ? `, ${nombre}` : ""}
      </h1>

      <p>Bienvenido. Usa el menú para gestionar propietarios, mascotas y citas.</p>
    </div>
  );
}