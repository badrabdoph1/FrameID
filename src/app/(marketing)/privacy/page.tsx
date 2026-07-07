import { getContent } from "@/lib/content";

export default function PrivacyPage() {
  const content = getContent("legal/privacy");

  return (
    <main className="container-page max-w-3xl py-20">
      <h1 className="text-4xl font-semibold">{content.title}</h1>
      {content.sections.map((section: { title: string; body: string }) => (
        <div key={section.title}>
          <h2 className="mt-8 text-2xl font-semibold">{section.title}</h2>
          <p className="mt-2 leading-8 text-muted-foreground">{section.body}</p>
        </div>
      ))}
    </main>
  );
}
