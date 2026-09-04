import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user?.role) {
    redirect(`/${user.role}`);
  }

  redirect("/sign-in");
}
