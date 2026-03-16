import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { TriangleAlert, Check } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SignInFlow } from "../types";

interface SignUpCardProps {
    setState: (state: SignInFlow) => void;
};

export const SignUpCard = ({ setState }: SignUpCardProps) => {
    const { signIn } = useAuthActions();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    // Password requirements check
    const hasMinLength = password.length >= 8 && password.length <= 30;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[-!@#$%^&*()+]/.test(password);
    const hasNoSequence = !/(abc|123|4444|qwer)/i.test(password);

    const requirements = [
        { label: "Contain 8 to 30 characters", met: hasMinLength },
        { label: "Contain both lower and uppercase letters", met: hasLowerCase && hasUpperCase },
        { label: "Contain 1 number", met: hasNumber },
        { label: "Contain 1 special character '-!@#$%^&*()+'", met: hasSpecialChar },
        { label: "Not contain letter or number sequences like 'abc' '123' '4444' 'qwer'", met: hasNoSequence },
    ];

    const onPasswordSignUp = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setPending(true);
        signIn("password", { name, email, password, flow: "signUp" })
            .catch(() => {
                setError("Something went wrong");
            })
            .finally(() => {
                setPending(false);
            });
    };

    const onProviderSignUp = (value: "github" | "google") => {
        setPending(true);
        signIn(value)
            .finally(() => {
                setPending(false)
            });
    };

    return (
        <Card className="w-full h-full p-8">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">
                    Sign up to continue
                </CardTitle>
                <CardDescription>
                    Use your email or username to login to your account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-0 pb-0">
                {!!error && (
                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                        <TriangleAlert className="size-4" />
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={onPasswordSignUp} className="space-y-2.5">
                    <Input
                        disabled={pending}
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError("");
                        }}
                        placeholder="Full name"
                        required
                    />
                    <Input
                        disabled={pending}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                        placeholder="Email"
                        type="email"
                        required
                    />
                    <Input
                        disabled={pending}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                        placeholder="Password"
                        type="password"
                        required
                    />
                    {/* Password Requirements */}
                    {password.length > 0 && (
                        <div className="space-y-2 py-2">
                            <p className="text-sm font-medium text-gray-700">Password must:</p>
                            <div className="space-y-1.5">
                                {requirements.map((req, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                        <div className={`flex items-center justify-center w-5 h-5 rounded-full ${req.met ? "bg-green-500" : "bg-gray-200"}`}>
                                            <Check className={`w-3 h-3 ${req.met ? "text-white" : "text-gray-400"}`} />
                                        </div>
                                        <span className={req.met ? "text-green-700" : "text-gray-500"}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <Input
                        disabled={pending}
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError("");
                        }}
                        placeholder="Confirm Password"
                        type="password"
                        required
                    />
                    <Button type="submit" className="w-full" size="lg" disabled={pending}>
                        Continue
                    </Button>
                </form>
                <Separator />
                <div className="flex flex-col gap-y-2.5">
                    <Button
                        disabled={pending}
                        onClick={() => onProviderSignUp("google")}
                        variant="outline"
                        size="lg"
                        className="w-full relative"
                    >
                        <FcGoogle className="size-5 absolute top-1/2 left-2.5 -translate-y-1/2" />
                        Continue with Google
                    </Button>
                    <Button
                        disabled={pending}
                        onClick={() => onProviderSignUp("github")}
                        variant="outline"
                        size="lg"
                        className="w-full relative"
                    >
                        <FaGithub className="size-5 absolute top-1/2 left-2.5 -translate-y-1/2" />
                        Continue with GitHub
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Already have an account? <span onClick={() => setState("signIn")} className="text-sky-700 hover:underline cursor-pointer">Sign in</span>
                </p>
            </CardContent>
        </Card>
    );
};