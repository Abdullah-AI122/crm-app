"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import logo from "@/app/assets/Logo.png";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
    { label: "Pricing", href: "/pricing" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
];

export default function Navbar() {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="w-full flex items-center justify-between px-6 sm:px-10 py-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Image src={logo} alt="Logo" priority />
                </div>
                <span className="text-black font-bold font-google-sans">Collaborate X</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                    <span key={link.href} onClick={() => router.push(link.href)} className="text-sm font-medium text-slate-600 hover:text-[#6C5CE7] cursor-pointer transition">{link.label}</span>
                ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
                <button onClick={() => router.push("/login")} className="text-sm font-semibold text-slate-700 hover:text-[#6C5CE7] px-4 py-2 rounded-lg transition">Sign In</button>
                <button onClick={() => router.push("/register")} className="text-sm font-semibold text-white bg-[#6C5CE7] hover:bg-[#5b4bd6] px-5 py-2 rounded-lg transition">Register</button>
            </div>

            <button className="md:hidden text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {menuOpen && (
                <div className="absolute top-16 left-0 right-0 flex flex-col gap-4 bg-white border-b border-slate-200 px-6 py-5 md:hidden">
                    {navLinks.map((link) => (
                        <span key={link.href} onClick={() => { router.push(link.href); setMenuOpen(false); }} className="cursor-pointer text-google-sans font-medium text-slate-600 hover:text-[#6C5CE7] ">{link.label}</span>
                    ))}

                    <button
                        onClick={() => {
                            router.push("/login");
                            setMenuOpen(false);
                        }}
                        className="cursor-pointer cursor-pointer text-sm font-semibold text-slate-700 text-left  font-google-sans">Sign In</button>
                    <button
                        onClick={() => {
                            router.push("/register");
                            setMenuOpen(false);
                        }}
                        className="cursor-pointer text-sm font-semibold text-white bg-[#6C5CE7] px-4 py-2 rounded-lg w-fit  font-google-sans">Register</button>
                </div>
            )}
        </nav>
    );
}