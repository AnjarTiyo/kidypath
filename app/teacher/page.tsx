import { redirect } from "next/navigation";

export default function TeacherPage() {
    return (
        redirect("/teacher/dashboard")
    )
}