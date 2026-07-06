import { redirect } from "next/navigation";

import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardDesignPage() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const templates = getPublishedTemplates();

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">Theme Engine</Badge>
        <h1 className="mt-4 text-3xl font-semibold">التصميم</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          قالب موقعك الحالي يعمل من Theme Engine ويمكن توسيعه دون تغيير بياناتك.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.code}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge tone={template.status === "published" ? "success" : "neutral"}>
                {template.status}
              </Badge>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {template.code}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
