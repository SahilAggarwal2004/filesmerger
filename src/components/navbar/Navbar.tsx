// Navbar.tsx
import Link from "next/link";
import { useState } from "react";
import { tools } from "@/constants";
import Hamburger from "../icons/Hamburger";
import Expandable from "./Expandable";

export default function Navbar() {
  const [hide, setHide] = useState(true);

  return (
    <nav className="sticky inset-0 z-30 flex flex-col items-center overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-900 dark:to-slate-800 shadow-md sm:flex-row sm:justify-between px-4 py-1">
      <div className="flex w-full h-12 items-center justify-between sm:justify-start sm:space-x-4">
        <Link href="/">
          <h1 className="text-white font-bold text-2xl">FilesMerger</h1>
        </Link>
        <button type="button" onClick={() => setHide(!hide)} className="sm:hidden">
          <Hamburger open={!hide} />
        </button>
      </div>
      <Expandable expand={!hide}>
        <div className="flex flex-col mt-3 space-y-1 sm:m-0 sm:flex-row sm:space-x-5 sm:space-y-0">
          {Object.values(tools).map(({ href, title }) => (
            <Link key={href} href={href} onClick={() => setHide(true)} className="text-white hover:text-indigo-200 min-w-max w-full text-center">
              {title}
            </Link>
          ))}
        </div>
      </Expandable>
    </nav>
  );
}
