import { redirect } from "next/navigation";

export default function OldContentRedirect() {
  redirect("/dashboard/site-info");
}
