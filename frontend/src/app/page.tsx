import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const userRole = (session?.user as any)?.role;
  if (userRole === "ADMIN") {
    redirect("/admin");
  }
  redirect("/employee");
}
 