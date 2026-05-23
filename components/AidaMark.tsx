interface AidaMarkProps {
  size?: number;
  className?: string;
}

export default function AidaMark({ size = 32, className = "" }: AidaMarkProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-accent text-white font-serif ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.46,
        letterSpacing: "0.01em",
      }}
      aria-hidden="true"
    >
      a
    </div>
  );
}
