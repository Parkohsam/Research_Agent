"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }

        // Temporary frontend login.
        // Real authentication will be connected to the backend later.
        router.push("/dashboard");
    }

    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="text-3xl font-bold text-black">
                        Research<span className="text-blue-600">AI</span>
                    </Link>

                    <p className="mt-2 text-gray-600">
                        Sign in to continue your research
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Welcome back
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Enter your details to access your research workspace.
                    </p>

                    <form onSubmit={handleLogin} className="mt-8 space-y-5">

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-black mb-2"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 text-black placeholder:text-gray-500 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-black mb-2"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 text-black placeholder:text-gray-500 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                        >
                            Log in
                        </button>
                    </form>

                    {/* Signup */}
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Dont have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>

                {/* Back to home */}
                <div className="text-center mt-6">
                    <Link
                        href="/"
                        className="text-bold text-gray-500 hover:text-gray-800"
                    >
                        Back to home
                    </Link>
                </div>

            </div>
        </main>
    );
}