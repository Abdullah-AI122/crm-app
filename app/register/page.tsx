"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import logo from "@/app/assets/Logo.png";
import Image from "next/image";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

const slides = [
    { heading: "Collaborate in real time", desc: "Work together with your team without missing a beat." },
    { heading: "Track every project", desc: "Keep tasks, files, and deadlines organized in one place." },
    { heading: "Stay in sync", desc: "See updates the moment they happen, wherever you are." }
];

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [slide, setSlide] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:4040/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(Array.isArray(data.errors) ? data.errors.join(", ") : data.message || "Registration failed");
                setLoading(false);
                return;
            }

            router.push("/login");
        } catch {
            setError("Cannot connect to server. Make sure your backend is running.");
            setLoading(false);
        }
    };

    return (
        <section className="w-full h-full bg-[#D9D9D9] p-3 font-google-sans">
            <div className="flex gap-3 w-full h-full">
                <div className="hidden lg:flex lg:w-[45%] relative flex-col items-center justify-center border bg-[#FF7675] rounded-2xl">
                    <Link href="/" className="cursor-pointer">
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-sm">
                            <Image src={logo} alt="Logo" priority />
                        </div>
                    </Link>
                    <div className="mt-6 max-w-xs text-center">
                        <h2 className="text-lg font-semibold ">{slides[slide].heading}</h2>
                        <p className="mt-2 text-xs">{slides[slide].desc}</p>
                    </div>

                    <div className="absolute bottom-10 flex gap-2">
                        {slides.map((_, i) => (
                            <span key={i} onClick={() => setSlide(i)} className={`h-1.5 w-1.5 rounded-full cursor-pointer ${i === slide ? "bg-white" : "bg-black/40"}`} />
                        ))}
                    </div>
                </div>

                <div className="w-full lg:w-[55%] flex flex-col px-6 sm:px-16 py-8 rounded-xl bg-white">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="cursor-pointer">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                                <Image src={logo} alt="Logo" priority />
                            </div>
                        </Link>

                        <p className="text-sm text-slate-600">
                            Already have an account?{" "}
                            <span onClick={() => router.push("/login")} className="font-semibold text-[#FF7675] underline cursor-pointer">Login</span>
                        </p>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-full max-w-sm">
                            <div className="mb-8 text-center">
                                <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                                <p className="mt-2 text-sm text-slate-500">Create your CRM workspace account</p>
                            </div>

                            {error && (
                                <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-[#FF7675]/30 bg-[#FF7675]/10 px-4 py-3 text-sm text-[#FF7675] text-center">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-800">First Name</label>
                                        <input name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required disabled={loading} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-black placeholder:text-zinc-400 outline-none focus:border-black disabled:opacity-60" />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-800">Last Name</label>
                                        <input name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required disabled={loading} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-black placeholder:text-zinc-400 outline-none focus:border-black disabled:opacity-60" />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-800">Email</label>
                                    <input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required disabled={loading} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-black placeholder:text-zinc-400 outline-none focus:border-black disabled:opacity-60" />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label>
                                    <div className="relative">
                                        <input name="password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={formData.password} onChange={handleChange} required minLength={8} disabled={loading} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 pr-10 text-sm text-black placeholder:text-zinc-400 outline-none focus:border-black disabled:opacity-60" />
                                        <button type="button" disabled={loading} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#00B894] disabled:opacity-50">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-800">Confirm Password</label>
                                    <div className="relative">
                                        <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required minLength={8} disabled={loading} className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 pr-10 text-sm text-black placeholder:text-zinc-400 outline-none focus:border-black disabled:opacity-60" />
                                        <button type="button" disabled={loading} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#00B894] disabled:opacity-50">
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#FF7675] py-3 text-sm font-semibold text-white transition hover:bg-[#FF7675] disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer">
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center ">© 2026 Collaborate X</span>
                        <div className="flex gap-4">
                            <span className="cursor-pointer hover:text-[#6C5CE7]">Privacy Policy</span>
                            <span className="cursor-pointer hover:text-[#6C5CE7]">Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}