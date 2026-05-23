interface AidaWordmarkProps {
  /** Width in px. Height scales with the aspect ratio of the source PNG. */
  width?: number;
  className?: string;
}

/**
 * Renders the Aida wordmark from /aida-logo.png using a CSS mask so the
 * source white PNG can be recoloured to the brand accent on any background.
 *
 * Save the supplied logo PNG to `public/aida-logo.png`.
 */
export default function AidaWordmark({
  width = 96,
  className = "",
}: AidaWordmarkProps) {
  // Source PNG is roughly square; the wordmark itself sits on the lower-
  // centre, so we render at a 2.4:1 aspect to crop down to the inked area.
  const height = Math.round(width / 2.4);
  const style: React.CSSProperties = {
    width,
    height,
    backgroundColor: "currentColor",
    WebkitMaskImage: "url(/aida-logo.png)",
    maskImage: "url(/aida-logo.png)",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };

  // Caller controls the colour via a text-* class. Falls back to text-accent
  // when no override is supplied.
  const colourClass = /text-/.test(className) ? "" : "text-accent";

  return (
    <span
      role="img"
      aria-label="Aida"
      className={`inline-block ${colourClass} ${className}`.trim()}
      style={style}
    />
  );
}
