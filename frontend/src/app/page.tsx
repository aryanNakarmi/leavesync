import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LandingPage from "./landing-page";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const userRole = (session?.user as any)?.role;
    if (userRole === "ADMIN") {
      redirect("/admin");
    }
    redirect("/employee");
  }

  return <LandingPage />;
}
