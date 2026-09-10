import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold">
          Research<span className="text-indigo-600">AI</span>
        </Link>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-full">
          AI-powered academic research
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Find the right research
          <br />
          <span className="text-indigo-600">papers faster.</span>
        </h1>

        <p className="max-w-2xl mx-auto mt-6 text-lg leading-8 text-gray-600">
          ResearchAI helps you discover, evaluate, rank, and understand
          academic literature so you can spend less time searching and more
          time doing research.
        </p>

        {/* Hero buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
          <Link
            href="/signup"
            className="px-7 py-3.5 text-white font-medium bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
          >
            Start Research
          </Link>

          <a
            href="#how-it-works"
            className="px-7 py-3.5 font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-10"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">
            From research topic to useful literature
          </h2>

          <p className="mt-3 text-gray-600">
            Let AI handle the heavy literature discovery and evaluation work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold">
              01
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Describe your topic
            </h3>

            <p className="mt-3 text-gray-600 leading-7">
              Enter your research topic or research question and let the AI
              understand the concepts you are investigating.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold">
              02
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Discover and evaluate
            </h3>

            <p className="mt-3 text-gray-600 leading-7">
              Search academic sources and evaluate a broad pool of papers
              based on relevance, quality, recency, and evidence.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold">
              03
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Get ranked recommendations
            </h3>

            <p className="mt-3 text-gray-600 leading-7">
              Receive a ranked shortlist of the strongest papers with AI
              analysis, key findings, methodology, and research insights.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold">
            Ready to start your research?
          </h2>

          <p className="mt-4 text-gray-600">
            Turn a research topic into a structured understanding of the
            academic literature.
          </p>

          <Link
            href="/signup"
            className="inline-block mt-8 px-7 py-3.5 text-white font-medium bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
          >
            Start Research
          </Link>
        </div>
      </section>
    </main>
  );
}