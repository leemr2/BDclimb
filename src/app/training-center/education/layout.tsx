import { preloadEducationContent } from "@/lib/content/education";
import { TrainingAuthRedirect } from "@/components/training/TrainingAuthRedirect";

export default async function EducationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await preloadEducationContent();

  return (
    <>
      <TrainingAuthRedirect />
      {children}
    </>
  );
}
