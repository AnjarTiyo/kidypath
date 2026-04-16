"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { IconArrowBack } from "@tabler/icons-react";

export default function NotImplemented() {
    const router = useRouter();

    return (
        <div className="min-h-full w-full flex flex-col gap-2 items-center justify-center">
            <h1>Fitur ini sedang dalam tahap pengembangan</h1>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                <IconArrowBack className="mr-2" />
                Kembali
            </Button>
        </div>
    )
}