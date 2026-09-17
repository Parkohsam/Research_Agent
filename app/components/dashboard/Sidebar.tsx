"use client";

import { useState } from "react";
import {
    Plus,
    Trash2,
    X,
    Check,
    Settings,
} from "lucide-react";

import type { Research } from "@/lib/graphql";

type SidebarProps = {
    researchList: Research[];
    onNewResearch: () => void;
    onSelectResearch: (research: Research) => void;
    onDeleteResearch: (research: Research) => void;
    userName: string;
};

export default function Sidebar({
    researchList,
    onNewResearch,
    onSelectResearch,
    onDeleteResearch,
    userName,
}: SidebarProps) {
    const [researchToDelete, setResearchToDelete] =
        useState<Research | null>(null);

    const userInitial = userName
        ? userName.charAt(0).toUpperCase()
        : "U";

    return (
        <aside className="flex h-screen w-[230px] flex-col border-r border-gray-200 bg-white">
            {/* Logo */}
            <div className="px-5 py-3">
                <h1 className="text-lg font-bold tracking-tight">
                    Research
                    <span className="text-blue-600">AI</span>
                </h1>
            </div>

            {/* New Research Button */}
            <div className="px-3 py-4">
                <button
                    type="button"
                    onClick={onNewResearch}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                    <Plus size={17} />
                    <span>New Research</span>
                </button>
            </div>

            {/* Research List */}
            <div className="flex-1 overflow-y-auto px-3">
                <h2 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                    My Research
                </h2>

                {researchList.length === 0 ? (
                    <p className="px-2 text-sm text-gray-500">
                        No research yet
                    </p>
                ) : (
                    <div className="space-y-1">
                        {researchList.map((research) => {
                            const isDeleting =
                                researchToDelete?.id === research.id;

                            return (
                                <div
                                    key={research.id}
                                    className="group rounded-lg"
                                >
                                    {isDeleting ? (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                            <p className="mb-3 text-xs leading-5 text-red-700">
                                                Delete this research and all
                                                its papers?
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onDeleteResearch(
                                                            research
                                                        );
                                                        setResearchToDelete(
                                                            null
                                                        );
                                                    }}
                                                    className="flex items-center gap-1 rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                                >
                                                    <Check size={13} />
                                                    Delete
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setResearchToDelete(
                                                            null
                                                        )
                                                    }
                                                    className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                                >
                                                    <X size={13} />
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-1 rounded-lg px-2 py-2 hover:bg-gray-50">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onSelectResearch(research)
                                                }
                                                className="min-w-0 flex-1 text-left"
                                            >
                                                <p className="truncate text-sm text-gray-900">
                                                    {research.title}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-600">
                                                    {research.papers?.length ??
                                                        0}{" "}
                                                    papers
                                                </p>
                                            </button>

                                            <button
                                                type="button"
                                                aria-label={`Delete ${research.title}`}
                                                onClick={() =>
                                                    setResearchToDelete(
                                                        research
                                                    )
                                                }
                                                className="mt-1 rounded p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-200 px-4 py-5">
                <button
                    type="button"
                    className="mb-6 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                    <Settings size={16} />
                    <span>Settings</span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-400 bg-neutral-800 text-sm font-medium text-white">
                        {userInitial}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                            {userName || "User"}
                        </p>

                        <p className="text-xs text-gray-600">
                            Researcher
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}