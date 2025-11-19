import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export function WeeklySummary() {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Ringkasan Mingguan</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        <div>
          <p className="font-semibold">Sosial & Emosional</p>
          <p className="text-muted-foreground">Perkembangan baik 😊</p>
        </div>
        <div>
          <p className="font-semibold">Bahasa</p>
          <p className="text-muted-foreground">Perlu perhatian 🧩</p>
        </div>
      </CardContent>
    </Card>
  );
}
