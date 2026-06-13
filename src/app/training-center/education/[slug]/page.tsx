import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BOULDERING_EDUCATION_REGISTRY,
  getEducationPiece,
} from "@/lib/content/education";
import { TrainingAuthGate } from "@/components/training/TrainingAuthGate";
import { EducationArticle } from "@/components/training/education/EducationArticle";

export function generateStaticParams() {
  return BOULDERING_EDUCATION_REGISTRY.map((piece) => ({
    slug: piece.slug,
  }));
}

export default async function EducationArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const piece = await getEducationPiece(slug);

  if (!piece) {
    notFound();
  }

  return (
    <TrainingAuthGate>
      <div className="education-article-page">
        <div className="education-page-nav">
          <Link href="/training-center/education" className="training-center-back">
            ← Back to library
          </Link>
        </div>
        <EducationArticle piece={piece} />
      </div>
    </TrainingAuthGate>
  );
}
