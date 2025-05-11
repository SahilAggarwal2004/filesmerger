import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
