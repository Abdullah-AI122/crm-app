"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken, saveUser } from "../../lib/auth";

export default function LoginPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch("http://localhost:4040/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Invalid credentials");
                setLoading(false);
                return;
            }

            // Save credentials
            saveToken(data.token);
            saveUser(data.user);

            // Redirect
            router.push("/dashboard");
        } catch (err: any) {
            setError("Cannot connect to the server. Please verify your backend is running.");
            setLoading(false);
        }
    };

    return (
        <div className="
            min-h-screen
            flex
            items-center
            justify-center
            bg-slate-50
            px-5
        ">
            <div className="
                w-full
                max-w-md
                bg-white
                rounded-2xl
                border
                border-slate-200
                shadow-sm
                p-8
            ">
                <div className="mb-8 text-center">
                    <div className="
                        mx-auto
                        mb-4
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-black
                        text-white
                        text-xl
                        font-bold
                    ">
                        C
                    </div>

                    <h1 className="
                        text-3xl
                        font-semibold
                        text-slate-900
                    ">
                        Welcome Back
                    </h1>

                    <p className="
                        mt-2
                        text-sm
                        text-slate-500
                    ">
                        Login to your CRM workspace
                    </p>
                </div>

                {error && (
                    <div className="
                        mb-5
                        rounded-lg
                        border
                        border-red-200
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        text-red-600
                        text-center
                    ">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    <div>
                        <label className="
                            mb-2
                            block
                            text-sm
                            font-medium
                            text-slate-700
                        ">
                            Email Address
                        </label>

                        <input
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="
                                w-full
                                rounded-lg
                                border
                                border-slate-200
                                px-3
                                py-2.5
                                text-black
                                placeholder:text-black
                                outline-none
                                focus:border-black
                                disabled:opacity-60
                            "
                        />
                    </div>

                    <div>
                        <div className="
                            mb-2
                            flex
                            justify-between
                        ">
                            <label className="
                                text-sm
                                font-medium
                                text-slate-700
                            ">
                                Password
                            </label>

                            <span className="
                                cursor-pointer
                                text-sm
                                text-slate-500
                            ">
                                Forgot password?
                            </span>
                        </div>

                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-200
                                    px-3
                                    py-2.5
                                    pr-16
                                    text-black
                                    placeholder:text-black
                                    outline-none
                                    focus:border-black
                                    disabled:opacity-60
                                "
                            />

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => setShowPassword(!showPassword)}
                                className="
                                    absolute
                                    right-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-sm
                                    text-slate-600
                                    disabled:opacity-50
                                "
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            w-full
                            rounded-lg
                            bg-black
                            py-3
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-slate-800
                            disabled:bg-slate-400
                            disabled:cursor-not-allowed
                            flex
                            items-center
                            justify-center
                        "
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            "Login"
                        )}
                    </button>
                </form>

                <p className="
                    mt-6
                    text-center
                    text-sm
                    text-slate-500
                ">
                    Don't have an account?
                    <span 
                        onClick={() => router.push("/register")}
                        className="
                            ml-1
                            cursor-pointer
                            font-medium
                            text-black
                            hover:underline
                        "
                    >
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
}
