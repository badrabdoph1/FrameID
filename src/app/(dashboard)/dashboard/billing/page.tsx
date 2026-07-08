import { redirect } from "next/navigation";

export default function OldBillingRedirect() {
  redirect("/dashboard/settings");
}
