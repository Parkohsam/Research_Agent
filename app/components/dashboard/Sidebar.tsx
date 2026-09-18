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
    mobileOpen: boolean;
    onCloseMobile: () => void;
};

export default function Sidebar({
    researchList,
    onNewResearch,
    onSelectResearch,
    onDeleteResearch,
    userName,
    mobileOpen,
    onCloseMobile,
}: SidebarProps) {
    const [researchToDelete, setResearchToDelete] =
        useState<Research | null>(null);

    const userInitial = userName
        ? userName.charAt(0).toUpperCase()
        : "U";

    const handleNewResearch = () => {
        setResearchToDelete(null);
        onNewResearch();
        onCloseMobile();
    };

    const handleSelectResearch = (
        research: Research
    ) => {
        setResearchToDelete(null);
        onSelectResearch(research);
        onCloseMobile();
    };

    const handleConfirmDelete = (
        research: Research
    ) => {
        onDeleteResearch(research);
        setResearchToDelete(null);
    };

    return (
        <>
            {/* ================================= */}
            {/* Mobile Overlay                    */}
            {/* ================================= */}

            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={onCloseMobile}
                    className="fixed inset-0 z-40 bg-black/30 md:hidden"
                />
            )}

            {/* ================================= */}
            {/* Sidebar                           */}
            {/* ================================= */}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-50
                    flex w-[280px] flex-col
                    border-r border-gray-200
                    bg-white
                    shadow-xl
                    transition-transform duration-300 ease-in-out

                    md:static
                    md:z-auto
                    md:w-[260px]
                    md:shrink-0
                    md:translate-x-0
                    md:shadow-none

                    ${
                        mobileOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }
                `}
            >
                {/* ================================= */}
                {/* Logo                              */}
                {/* ================================= */}

                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
                    <h1 className="text-xl font-bold tracking-tight">
                        Research
                        <span className="text-blue-600">
                            AI
                        </span>
                    </h1>

                    {/* Mobile close button */}

                    <button
                        type="button"
                        onClick={onCloseMobile}
                        aria-label="Close sidebar"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 md:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ================================= */}
                {/* New Research Button               */}
                {/* ================================= */}

                <div className="px-4 py-5">
                    <button
                        type="button"
                        onClick={handleNewResearch}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
                    >
                        <Plus size={18} />

                        <span>
                            New Research
                        </span>
                    </button>
                </div>

                {/* ================================= */}
                {/* Research List                     */}
                {/* ================================= */}

                <div className="min-h-0 flex-1 overflow-y-auto px-3">
                    <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        My Research
                    </h2>

                    {researchList.length === 0 ? (
                        <div className="rounded-xl bg-gray-50 px-3 py-4">
                            <p className="text-sm text-gray-500">
                                No research yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {researchList.map(
                                (research) => {
                                    const isDeleting =
                                        researchToDelete?.id ===
                                        research.id;

                                    return (
                                        <div
                                            key={
                                                research.id
                                            }
                                            className="group"
                                        >
                                            {isDeleting ? (
                                                /* ================================= */
                                                /* Delete Confirmation               */
                                                /* ================================= */

                                                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                                                    <p className="mb-3 text-xs leading-5 text-red-700">
                                                        Delete this
                                                        research and
                                                        all its
                                                        papers?
                                                    </p>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleConfirmDelete(
                                                                    research
                                                                )
                                                            }
                                                            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                                                        >
                                                            <Check
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            Delete
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setResearchToDelete(
                                                                    null
                                                                )
                                                            }
                                                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                                        >
                                                            <X
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* ================================= */
                                                /* Research Item                     */
                                                /* ================================= */

                                                <div className="flex items-start gap-1 rounded-xl px-2 py-2 transition hover:bg-gray-50">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelectResearch(
                                                                research
                                                            )
                                                        }
                                                        className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left"
                                                    >
                                                        <p className="truncate text-sm font-medium text-gray-900">
                                                            {
                                                                research.title
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {research
                                                                .papers
                                                                ?.length ??
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
                                                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                                                    >
                                                        <Trash2
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>

                {/* ================================= */}
                {/* Bottom Section                    */}
                {/* ================================= */}

                <div className="border-t border-gray-200 px-4 py-4">
                    {/* Settings */}

                    <button
                        type="button"
                        className="mb-4 flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                        <Settings size={17} />

                        <span>
                            Settings
                        </span>
                    </button>

                    {/* User */}

                    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold text-white">
                            {userInitial}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                                {userName || "User"}
                            </p>

                            <p className="text-xs text-gray-500">
                                Researcher
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}