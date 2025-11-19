import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActivityItem } from "@/components/ui/activity-item";

export default function DashboardPage() {
  return (
    <div className="pb-20"> {/* bottom space for nav */}
      {/* Header */}
      <header className="p-4">
        <h1 className="text-xl font-semibold">👋 Hai, Bu Sari</h1>
        <p className="text-sm text-muted-foreground">
          Senin, 18 November 2025
        </p>
      </header>

      <div className="p-4 flex flex-col gap-4">

        {/* Card: Status Harian */}
        <Card className="border rounded-xl">
          <CardHeader>
            <CardTitle>Status Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>✔ 12 Anak Hadir</p>
            <p>✏ Belum ada jurnal dibuat</p>

            <Button size="sm" className="w-full gap-2">
              <Plus size={16} /> Buat Jurnal Baru
            </Button>
          </CardContent>
        </Card>

        {/* Card: Tema Minggu Ini */}
        <Card className="border rounded-xl">
          <CardHeader>
            <CardTitle>Tema Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="font-medium">"Binatang di Kebun"</p>
            <p>3 kegiatan direncanakan</p>
          </CardContent>
        </Card>

        {/* Aktivitas terbaru */}
        <section className="mt-2">
          <h2 className="font-semibold mb-2">Aktivitas Terbaru</h2>

          <div className="space-y-2">
            <ActivityItem title="Jurnal Jumat, 15 Nov" date="2 hari lalu" />
            <ActivityItem title="Catatan Perkembangan Raka" date="3 hari lalu" />
            <ActivityItem title="Upload Foto Kegiatan" date="4 hari lalu" />
          </div>
        </section>
      </div>
    </div>
  );
}
