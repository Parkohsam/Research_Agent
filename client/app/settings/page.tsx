"use client";

import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();

    function handleLogout() {
        // Temporary frontend logout
        router.push("/");
    }

    function handleChangePassword() {
        // Temporary action
        alert("Password change will be connected to authentication later.");
    }

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="font-medium text-gray-500 hover:text-gray-800 transition"
                >
                    Back
                </button>

                <h1 className="ml-6 font-semibold text-gray-900">
                    Settings
                </h1>
            </header>

            {/* Settings Content */}
            <section className="max-w-3xl mx-auto px-6 py-10 space-y-6">

                {/* Account Information */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Account Information
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Manage your ResearchAI account information.
                    </p>

                    <div className="mt-8 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Name
                            </label>

                            <input
                                type="text"
                                value="Adediran"
                                readOnly
                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>

                            <input
                                type="email"
                                value="researcher@example.com"
                                readOnly
                                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Security
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Manage your account security.
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                Password
                            </p>

                            <p className="text-sm text-gray-500 mt-1">
                                Change your account password.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleChangePassword}
                            className="shrink-0 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Change Password
                        </button>
                    </div>
                </div>

                {/* Account */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Account
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Sign out of your ResearchAI account.
                    </p>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-6 px-5 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
                    >
                        Log out
                    </button>
                </div>

            </section>
        </main>
    );
}