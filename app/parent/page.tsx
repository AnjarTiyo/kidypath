"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const emojis = [
  { id: 1, label: "Sedih", icon: "😢" },
  { id: 2, label: "Biasa", icon: "😐" },
  { id: 3, label: "Senang", icon: "🙂" },
  { id: 4, label: "Gembira", icon: "😄" },
  { id: 5, label: "Sangat Bahagia", icon: "🤩" },
];

export default function ParentDashboard() {
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(3);

  const habits = [
    "Makan siang habis",
    "Berdoa bersama",
    "Aktif bermain",
    "Merapikan alat",
    "Tidur siang",
  ];

  const photos = [
    "/img/k1.jpg",
    "/img/k2.jpg",
    "/img/k3.jpg",
    "/img/k4.jpg",
  ];

  return (
    <div className="pb-20 space-y-6">

      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <Image src="/school-logo.png" alt="School Logo" width={48} height={48} />
        <Image src="/app-logo.png" alt="App Logo" width={48} height={48} />
      </header>

      {/* Calendar */}
      <section className="px-4">
        <Swiper slidesPerView={6} spaceBetween={12}>
          {Array.from({ length: 14 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 7 + i);

            const d = date.getDate();
            const day = date.toLocaleDateString("id-ID", { weekday: "short" });

            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <SwiperSlide key={i}>
                <div
                  className={`rounded-xl p-2 text-center border ${
                    isToday ? "bg-blue-600 text-white" : "bg-white"
                  }`}
                >
                  <div className="text-xs">{day}</div>
                  <div className="font-bold">{d}</div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section>

      {/* Section: Hari ini anak merasa */}
      <Card className="mx-4">
        <CardHeader>
          <CardTitle>Hari ini Raka merasa...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            {emojis.map((e) => (
              <div
                key={e.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setSelectedEmoji(e.id)}
              >
                <span
                  className={`text-3xl transition ${
                    selectedEmoji === e.id ? "grayscale-0" : "grayscale"
                  }`}
                >
                  {e.icon}
                </span>
                <span className="text-xs mt-1">{e.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 text-sm text-muted-foreground">
            Catatan: Hari ini Raka terlihat sangat ceria 😊
          </div>
        </CardContent>
      </Card>

      {/* Section: Daily Habit */}
      <Card className="mx-4">
        <CardHeader>
          <CardTitle>Daily Habit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">

            {/* Checklist */}
            <div className="space-y-3">
              {habits.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">{h}</span>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <p className="text-sm font-semibold mb-1">Catatan</p>
              <p className="text-sm text-muted-foreground">
                Raka makan dengan lahap hari ini.
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Section: Daily Report */}
      <Card className="mx-4">
        <CardHeader>
          <CardTitle>Daily Report</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">Hari ini belajar tentang:</p>
            <p className="text-sm text-muted-foreground">
              Mengenal hewan berkaki empat.
            </p>
          </div>

          <div>
            <p className="font-semibold">Hari ini kegiatannya:</p>
            <p className="text-sm text-muted-foreground">
              Mewarnai gambar kucing, bernyanyi lagu “Cicak-cicak di Dinding”, dan bermain peran hewan.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section: Photos */}
      <section className="px-4 mb-10">
        <h2 className="font-semibold mb-2">Foto Kegiatan</h2>
        <div className="grid grid-cols-2 gap-2">
          {photos.map((src, i) => (
            <img
              key={i}
              src={src}
              className="rounded-lg h-28 w-full object-cover"
              alt="Foto kegiatan"
            />
          ))}
        </div>
      </section>

    </div>
  );
}
