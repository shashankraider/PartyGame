import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#c8a46a]">Case file missing</p>
      <h1 className="text-4xl font-semibold">This mystery could not be found.</h1>
      <p className="mt-4 text-lg text-[#a6a29a]">
        The case id does not match a playable case in the local cases folder.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit rounded-full border border-white/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#f5f2ea] transition hover:border-[#c8a46a] hover:text-[#e6bd77]"
      >
        Back to case picker
      </Link>
    </main>
  );
}
