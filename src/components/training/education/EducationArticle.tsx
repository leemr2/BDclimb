import type { EducationPiece } from "@/lib/types/education";

interface EducationArticleProps {
  piece: EducationPiece;
}

export function EducationArticle({ piece }: EducationArticleProps) {
  return (
    <article className="education-article">
      <header className="education-article-header">
        <h1 className="education-article-title">{piece.title}</h1>
        <p className="education-article-subtitle">{piece.subtitle}</p>
        <p className="education-article-meta">{piece.readTimeMinutes} min read</p>
      </header>

      <div className="education-article-body">{piece.content}</div>

      {piece.keyTakeaways.length > 0 && (
        <footer className="education-article-takeaways">
          <h2 className="education-takeaways-title">Key takeaways</h2>
          <ul className="education-takeaways-list">
            {piece.keyTakeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </footer>
      )}
    </article>
  );
}
