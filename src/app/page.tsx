import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminHome() {
  const c = await cookies();
  const uid = c.get("vf_uid")?.value;

  if (!uid) redirect("/admin/login");
  redirect("/admin/usuarios");
}