import Quill from "quill";
import { useEffect, useRef, useState } from "react";

interface RendererProps {
    value: string;
}

const Renderer = ({ value }: RendererProps) => {
    const [isEmpty, setIsEmpty] = useState(true); // ตั้งค่าเริ่มต้นเป็น true ไปก่อน
    const rendererRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!rendererRef.current) return;

        const container = rendererRef.current;
        const quill = new Quill(document.createElement("div"), {
            theme: "snow",
        });

        quill.enable(false);
        const contents = JSON.parse(value);
        quill.setContents(contents);


        const isTextEmpty = quill.getText().replace(/<(.|\n)*?>/g, "").trim().length === 0;


        setTimeout(() => setIsEmpty(isTextEmpty), 0);

        container.innerHTML = quill.root.innerHTML;

        return () => {
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [value]);

    return (
        <div
            ref={rendererRef}
            className={`ql-editor ql-renderer ${isEmpty ? "hidden" : ""}`}
        />
    );
};

export default Renderer;