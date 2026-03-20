"use client";

import { useState } from "react";
import Image from "next/image";
import { SignInFlow } from "../types";

import { SignInCard } from "./sign-in-card";
import { SignUpCard } from "./sign-up-card";
import { ResetPasswordCard } from "./reset-password-card";

export const AuthScreen = () => {
    const [state, setState] = useState<SignInFlow>("signIn");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-[oklch(68%_0.13_165.612)] to-[oklch(32%_0.1_165.612)] p-4 py-10">
            
            <div className="mb-6 flex flex-col items-center">
                <div className="bg-[oklch(35.5%_0.07_142)] p-4 rounded-full shadow-lg mb-3 border border-white/20">
                    <Image 
                        src="/Logo-Ct25.png"
                        alt="App Logo" 
                        width={90} 
                        height={90} 
                        className="object-contain rounded-full"
                    />
                </div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm tracking-wide">
                    Welcome to CT Workspace
                </h1>
            </div>

            <div className="w-full max-w-md md:w-105 shadow-2xl rounded-xl transition-all duration-300">
                {state === "signIn" ? (
                    <SignInCard setState={setState} />
                ) : state === "resetPassword" ? (
                    <ResetPasswordCard setState={setState} />
                ) : (
                    <SignUpCard setState={setState} />
                )}
            </div>
        </div>
    );
};