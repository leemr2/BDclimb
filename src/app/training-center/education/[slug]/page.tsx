import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  BOULDERING_EDUCATION_REGISTRY,
  getEducationPiece,
} from "@/lib/content/education";
import { EducationArticle } from "@/components/training/education/EducationArticle";

export function generateStaticParams() {
  return BOULDERING_EDUCATION_REGISTRY.map((piece) => ({
    slug: piece.slug,
  }));
}

const getCachedEducationPiece = cache(getEducationPiece);

export default async function EducationArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug.trim());
  const piece = await getCachedEducationPiece(slug);

  if (!piece) {
    notFound();
  }

  return (
    <div className="education-article-page">
      <div className="education-page-nav">
        <Link href="/training-center/education" className="training-center-back">
          ← Back to library
        </Link>
      </div>
      <EducationArticle piece={piece} />
    </div>
  );
}
