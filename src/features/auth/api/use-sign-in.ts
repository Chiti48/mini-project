import { useCallback, useMemo, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react"; // 🟢 เปลี่ยนมาใช้ของ Convex Auth

// 🟢 เพิ่ม newPassword เข้ามาเพื่อรองรับ flow "reset-verification"
type RequestType = {
    flow: "signIn" | "signUp" | "reset" | "reset-verification";
    email?: string;
    password?: string;
    newPassword?: string; 
    name?: string;
    code?: string;
};

// หมายเหตุ: signIn ของ Convex Auth มักจะ throw Error ถ้าพัง หรือ Resolve ถ้าสำเร็จ
// อาจจะไม่ได้ return data แบบเป๊ะๆ เหมือน API ทั่วไป แต่เราเก็บโครงสร้างเดิมของคุณไว้ได้ครับ
type ResponseType = void | null;

type Options = {
    onSuccess?: (data: ResponseType) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
    throwError?: boolean;
};

export const useSignIn = () => {
    const [data, setData] = useState<ResponseType>(null);
    const [error, setError] = useState<Error | null>(null);
    const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null);

    const isPending = useMemo(() => status === "pending", [status]);
    const isSuccess = useMemo(() => status === "success", [status]);
    const isError = useMemo(() => status === "error", [status]);
    const isSettled = useMemo(() => status === "settled", [status]);

    // 🟢 ดึง signIn มาจาก Convex Auth แทนการใช้ useMutation
    const { signIn } = useAuthActions();

    const mutate = useCallback(async (values: RequestType, options?: Options) => {
        try {
            setData(null);
            setError(null);
            setStatus("pending");

            // 🟢 เรียกใช้ signIn ของ Convex Auth โดยระบุ provider เป็น "password"
            const response = await signIn("password", values);
            
            setData(null);
            setStatus("success");
            options?.onSuccess?.(null);
            return null;
        } catch (error) {
            setStatus("error");
            setError(error as Error);
            options?.onError?.(error as Error);
            if (options?.throwError) {
                throw error;
            }
        } finally {
            setStatus("settled");
            options?.onSettled?.();
        }
    }, [signIn]);

    return {
        mutate,
        data,
        error,
        isPending,
        isSuccess,
        isError,
        isSettled,
    };
};