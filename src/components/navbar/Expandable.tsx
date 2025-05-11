export default function Expandable({ children, expand }: { children: React.ReactNode; expand: boolean }) {
  return (
    <div className={`grid grid-rows-[0fr] transition-all duration-200 sm:inline-block ${expand && "grid-rows-[1fr]"}`}>
      <div className="min-h-0">{children}</div>
    </div>
  );
}
