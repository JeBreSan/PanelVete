"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function killCookie(name: string) {
  document.cookie = name + "=; Max-Age=0; path=/";
  document.cookie = name + "=; Max-Age=0; path=/admin";
}

export default function AdminLogoutPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      killCookie("vf_uid");
      killCookie("vf_rol");
      localStorage.removeItem("token");
      sessionStorage.clear();
    } catch {}

    router.replace("/admin/login");
  }, []);

  return (
    <div style={{ color: "white", fontWeight: 900, padding: 18 }}>
      Cerrando sesión...
    </div>
  );
}
