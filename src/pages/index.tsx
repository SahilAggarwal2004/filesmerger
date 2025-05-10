import Head from "next/head";
import Link from "next/link";
import { tools } from "@/constants";

export default function Home() {
  return (
    <>
      <Head>
        <title>FilesMerger | Home</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">Welcome to FilesMerger</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="block transform transition-all duration-300 ease-in-out hover:scale-[1.025] hover:-translate-y-1 hover:bg-slate-100 dark:hover:bg-slate-700 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow hover:shadow-xl"
              >
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{tool.title}</h2>
                <p className="text-slate-600 dark:text-slate-300">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
