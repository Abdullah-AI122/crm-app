"use client";

import { useState } from "react";

export default function RegisterPage() {

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });


    const [error, setError] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);

    const [showConfirmPassword, setShowConfirmPassword] = useState(false);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };



    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        setError(null);


        if (formData.password !== formData.confirmPassword) {

            setError("Passwords do not match");

            return;
        }


        try {

            const response = await fetch(
                "http://localhost:4040/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );


            const data = await response.json();


            if (!response.ok) {

                if (data.errors && Array.isArray(data.errors)) {

                    setError(data.errors.join(", "));

                } else {

                    setError(data.message || "Registration failed");

                }

                return;
            }


            console.log("Success:", data);

            alert("Account created successfully!");



        } catch {

            setError(
                "Cannot connect to server. Make sure your backend is running."
            );

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
                        Create Account
                    </h1>


                    <p className="
                        mt-2
                        text-sm
                        text-slate-500
                    ">
                        Create your CRM workspace account
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
                    ">
                        {error}
                    </div>

                )}



                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >


                    <div className="grid grid-cols-2 gap-4">


                        <div>

                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                First Name
                            </label>


                            <input
                                name="firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
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
                                "
                            />

                        </div>



                        <div>

                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Last Name
                            </label>


                            <input
                                name="lastName"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={handleChange}
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
                                "
                            />

                        </div>


                    </div>



                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email
                        </label>


                        <input
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
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
                            "
                        />

                    </div>




                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Password
                        </label>


                        <div className="relative">

                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleChange}
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-200
                                    px-3
                                    py-2.5
                                    pr-14
                                    text-black
                                    placeholder:text-black
                                    outline-none
                                    focus:border-black
                                "
                            />


                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="
                                    absolute
                                    right-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-sm
                                    text-slate-600
                                "
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>


                        </div>

                    </div>





                    <div>

                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Confirm Password
                        </label>


                        <div className="relative">

                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="
                                    w-full
                                    rounded-lg
                                    border
                                    border-slate-200
                                    px-3
                                    py-2.5
                                    pr-14
                                    text-black
                                    placeholder:text-black
                                    outline-none
                                    focus:border-black
                                "
                            />


                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="
                                    absolute
                                    right-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-sm
                                    text-slate-600
                                "
                            >
                                {showConfirmPassword ? "Hide" : "Show"}
                            </button>


                        </div>


                    </div>




                    <button
                        type="submit"
                        className="
                            w-full
                            rounded-lg
                            bg-black
                            py-3
                            text-sm
                            font-medium
                            text-white
                            hover:bg-slate-800
                            transition
                        "
                    >
                        Create Account
                    </button>



                </form>



                <p className="
                    mt-6
                    text-center
                    text-sm
                    text-slate-500
                ">
                    Already have an account?
                    <span className="
                        ml-1
                        cursor-pointer
                        font-medium
                        text-black
                    ">
                        Login
                    </span>
                </p>



            </div>


        </div>

    );
}