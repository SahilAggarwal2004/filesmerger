export default function Hamburger({ open }: { open: boolean }) {
  return (
    <div className="flex scale-75 flex-col items-center justify-center space-y-1 rounded">
      <div className={`hamburger ${open ? "translate-y-2 rotate-45" : ""}`} />
      <div className={`hamburger ${open ? "opacity-0" : ""}`} />
      <div className={`hamburger ${open ? "-translate-y-2 -rotate-45" : ""}`} />
    </div>
  );
}
