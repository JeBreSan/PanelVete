import React from "react";
import { AdminShell } from "../AdminShell";

export const metadata = {
  title: "VetFarm Admin",
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
