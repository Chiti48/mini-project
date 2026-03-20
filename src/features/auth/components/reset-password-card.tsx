"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Lock, KeyRound } from "lucide-react";
import { SignInFlow } from "../types";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";

interface ResetPasswordCardProps {
    setState: (state: SignInFlow) => void;
}

export const ResetPasswordCard = ({ setState }: ResetPasswordCardProps) => {
    const { signIn } = useAuthActions();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [step, setStep] = useState<"request" | "verify">("request");
    const [isLoading, setIsLoading] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isBackPressed, setIsBackPressed] = useState(false);
    const [isResendPressed, setIsResendPressed] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setIsLoading(true);
        try {
            // Request password reset OTP
            await signIn("password", {
                email,
                flow: "reset"
            });

            toast.success("Password reset code sent to your email");
            setIsTransitioning(true);
            setTimeout(() => {
                setStep("verify");
                setIsTransitioning(false);
            }, 300);
        } catch (error) {
            toast.error("Failed to send reset code. Please check your email.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error("Please enter the 6-digit code");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            // Reset password with OTP and new password
            await signIn("password", {
                email,
                code: otp,
                newPassword: newPassword,
                flow: "reset-verification",
            });

            toast.success("Password reset successfully! You can now sign in.");
            setState("signIn");
        } catch (error) {
            toast.error("Invalid code or failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-xl p-8 w-full relative overflow-hidden">
            {/* Transition Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r from-[#337f37]/10 to-[#129a77]/10 transition-opacity duration-300 pointer-events-none ${isTransitioning ? "opacity-100" : "opacity-0"
                }`} />
            {/* Content Container */}
            <div className={`relative z-10 transition-all duration-300 ${isTransitioning ? "opacity-90" : "opacity-100"
                }`}>
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setState("signIn")}
                        onMouseDown={() => setIsBackPressed(true)}
                        onMouseUp={() => setIsBackPressed(false)}
                        onMouseLeave={() => setIsBackPressed(false)}
                        className={`flex items-center text-sm transition-all duration-150 ${isBackPressed
                                ? "text-gray-900 scale-95"
                                : "text-gray-600 hover:text-gray-900 hover:scale-105"
                            }`}
                    >
                        <ArrowLeft className={`w-4 h-4 mr-2 transition-transform duration-150 ${isBackPressed ? "-translate-x-1" : ""
                            }`} />
                        Back to Sign In
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${step === "request" ? "bg-[#337f37]" : "bg-gray-300"}`} />
                        <div className={`w-2 h-2 rounded-full ${step === "verify" ? "bg-[#337f37]" : "bg-gray-300"}`} />
                    </div>
                </div>

                {/* Logo/Icon */}
                <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br from-[#337f37] to-[#129a77] rounded-full flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-500 ${
                        // เพิ่มลูกเล่นให้ตัววงกลมพื้นหลังขยับเล็กน้อย
                        step === "request" ? "scale-100 rotate-0" : "scale-105 rotate-[-5deg]"
                        }`}>
                        {/* Icon 1: Mail (โชว์ตอน Step 'request' และบินขึ้นตอนเปลี่ยน Step) */}
                        <Mail className={`w-8 h-8 text-white absolute transition-all duration-500 ease-in-out ${step === "request"
                                ? "opacity-100 translate-y-0 rotate-0 scale-100" // สถานะปกติ
                                : "opacity-0 -translate-y-8 rotate-[-45deg] scale-75" // บินหนีขึ้นข้างบน
                            }`} />

                        {/* Icon 2: KeyRound (บินจากข้างล่างขึ้นมาโชว์ตอน Step 'verify') */}
                        <KeyRound className={`w-8 h-8 text-white absolute transition-all duration-500 ease-in-out ${step === "verify"
                                ? "opacity-100 translate-y-0 rotate-0 scale-100" // สถานะปกติ
                                : "opacity-0 translate-y-8 rotate-45 scale-75" // รออยู่ข้างล่าง
                            }`} />
                    </div>
                </div>

                {/* Step 1: Request OTP */}
                <div className={`transition-all duration-300 ease-in-out ${step === "request"
                        ? isTransitioning
                            ? "opacity-0 scale-95 -translate-x-4"
                            : "opacity-100 scale-100 translate-x-0"
                        : "opacity-0 scale-95 translate-x-4 absolute inset-0 pointer-events-none"
                    }`}>
                    {step === "request" && (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                                    Reset Password
                                </h2>
                                <p className="text-center text-gray-600 mb-6">
                                    Enter your email to receive a reset code
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#337f37] focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                onMouseDown={() => setIsPressed(true)}
                                onMouseUp={() => setIsPressed(false)}
                                onMouseLeave={() => setIsPressed(false)}
                                className={`w-full bg-gradient-to-r from-[#337f37] to-[#129a77] text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isPressed
                                        ? "scale-95 shadow-inner from-[#2a6d2f] to-[#0a7055]"
                                        : "hover:from-[#2a6d2f] hover:to-[#0a7055] hover:scale-105 hover:shadow-xl"
                                    }`}
                            >
                                <span className={`transition-transform duration-200 ${isLoading ? "animate-pulse" : isPressed ? "scale-95" : ""
                                    }`}>
                                    {isLoading ? "Sending..." : "Send Reset Code"}
                                </span>
                            </button>
                        </form>
                    )}
                </div>

                {/* Step 2: Verify OTP + New Password */}
                <div className={`transition-all duration-300 ease-in-out ${step === "verify"
                        ? isTransitioning
                            ? "opacity-0 scale-95 translate-x-4"
                            : "opacity-100 scale-100 translate-x-0"
                        : "opacity-0 scale-95 -translate-x-4 absolute inset-0 pointer-events-none"
                    }`}>
                    {step === "verify" && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                                    Verify & Reset
                                </h2>
                                <p className="text-center text-gray-600 mb-6">
                                    Enter the code from your email and set a new password
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Code
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#337f37] focus:border-transparent transition-all duration-200 text-center text-xl font-mono tracking-widest"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your email</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#337f37] focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#337f37] focus:border-transparent transition-all duration-200"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                onMouseDown={() => setIsPressed(true)}
                                onMouseUp={() => setIsPressed(false)}
                                onMouseLeave={() => setIsPressed(false)}
                                className={`w-full bg-gradient-to-r from-[#337f37] to-[#129a77] text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isPressed
                                        ? "scale-95 shadow-inner from-[#2a6d2f] to-[#0a7055]"
                                        : "hover:from-[#2a6d2f] hover:to-[#0a7055] hover:scale-105 hover:shadow-xl"
                                    }`}
                            >
                                <span className={`transition-transform duration-200 ${isLoading ? "animate-pulse" : isPressed ? "scale-95" : ""
                                    }`}>
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </span>
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsResendPressed(true);
                                        setIsTransitioning(true);
                                        setTimeout(() => {
                                            setStep("request");
                                            setIsTransitioning(false);
                                            setIsResendPressed(false);
                                        }, 300);
                                    }}
                                    onMouseDown={() => setIsResendPressed(true)}
                                    onMouseUp={() => setIsResendPressed(false)}
                                    onMouseLeave={() => setIsResendPressed(false)}
                                    className={`text-sm transition-all duration-150 ${isResendPressed
                                            ? "text-[#2a6d2f] scale-95"
                                            : "text-[#337f37] hover:text-[#2a6d2f] hover:scale-105"
                                        }`}
                                >
                                    Didn&apos;t receive the code? Resend
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
