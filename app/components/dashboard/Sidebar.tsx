"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Research = {
  id: string;
  title: string;
  papers: number;
};

type SidebarProps = {
  researchList: Research[];
  onNewResearch: () => void;
  onSelectResearch: (research: Research) => void;
};

export default function Sidebar({
  researchList,
  onNewResearch,
  onSelectResearch,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  function handleNewResearch() {
    onNewResearch();
    setIsOpen(false);
  }

  function handleResearchSelect(research: Research) {
    onSelectResearch(research);
    setIsOpen(false);
  }

  function handleSettings() {
    setIsOpen(false);
    router.push("/settings");
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 text-black shadow-sm border border-gray-200 md:hidden"
        aria-label="Open sidebar"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          flex flex-col
          transform transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xl font-bold text-black"
          >
            Research<span className="text-blue-600">AI</span>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-black hover:text-black md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New Research */}
        <div className="px-4">
          <button
            type="button"
            onClick={handleNewResearch}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            + New Research
          </button>
        </div>

        {/* Research list */}
        <div className="flex-1 px-4 mt-8 overflow-y-auto">
          <p className="px-2 text-xs font-semibold uppercase tracking-wider text-black">
            My Research
          </p>

          <div className="mt-3 space-y-1">
            {researchList.map((research) => (
              <button
                key={research.id}
                type="button"
                onClick={() => handleResearchSelect(research)}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-100 transition"
              >
                <p className="text-sm font-medium text-black">
                  {research.title}
                </p>

                <p className="text-xs text-black mt-1">
                  {research.papers} papers
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-200 p-4 space-y-2">
          {/* Settings */}
          <button
            type="button"
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-black hover:bg-gray-100 hover:text-black transition"
          >
            <span className="text-lg">⚙</span>

            <span>Settings</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
              A
            </div>

            <div>
              <p className="text-sm font-medium text-black">
                Adediran
              </p>

              <p className="text-xs text-black">
                Researcher
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}