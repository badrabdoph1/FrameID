import { redirect } from "next/navigation";

type RetiredPageStudioEditorRouteProps = {
  params: Promise<{ pageId: string }>;
};

export default async function RetiredPageStudioEditorRoute({ params }: RetiredPageStudioEditorRouteProps) {
  const { pageId } = await params;
  redirect(pageId === "marketing-homepage" ? "/admin/content/pages/home" : "/admin/content");
}
