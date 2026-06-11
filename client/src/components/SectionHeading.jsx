export default function SectionHeading({ eyebrow, title, text, align = "left" }) {
  return (
    <header className={`section-heading ${align === "center" ? "center" : ""}`}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </header>
  );
}
