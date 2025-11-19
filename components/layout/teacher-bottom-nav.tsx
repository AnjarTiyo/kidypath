import Link from "next/link";
import { Home, Notebook, Users, User } from "lucide-react";

export function TeacherBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm z-50">
      <div className="grid grid-cols-4 text-center py-2">
        <Link href="/dashboard" className="flex flex-col items-center text-xs">
          <Home size={20} />
          Home
        </Link>
        <Link href="/jurnal" className="flex flex-col items-center text-xs">
          <Notebook size={20} />
          Jurnal
        </Link>
        <Link href="/anak" className="flex flex-col items-center text-xs">
          <Users size={20} />
          Anak
        </Link>
        <Link href="/profil" className="flex flex-col items-center text-xs">
          <User size={20} />
          Profil
        </Link>
      </div>
    </nav>
  );
}
