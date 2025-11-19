export function ScheduleList() {
  const schedule = [
    { time: "08:00", activity: "Bermain bebas" },
    { time: "09:00", activity: "Tema: Binatang kebun" },
    { time: "10:00", activity: "Mewarnai" },
  ];

  return (
    <div>
      <h2 className="font-semibold mb-2">Jadwal Hari Ini</h2>
      <div className="space-y-2 text-sm">
        {schedule.map((item, i) => (
          <div key={i} className="flex justify-between border rounded-lg p-3 bg-card">
            <span>{item.time}</span>
            <span className="font-medium">{item.activity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
