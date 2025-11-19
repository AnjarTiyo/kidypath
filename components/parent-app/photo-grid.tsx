export function PhotoGrid() {
  const photos = [
    "/img/kegiatan1.jpg",
    "/img/kegiatan2.jpg",
    "/img/kegiatan3.jpg",
    "/img/kegiatan4.jpg",
  ];

  return (
    <div>
      <h2 className="font-semibold mb-2">Foto Kegiatan</h2>

      <div className="grid grid-cols-2 gap-2">
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            className="h-28 w-full object-cover rounded-lg"
            alt="Foto kegiatan"
          />
        ))}
      </div>
    </div>
  );
}
