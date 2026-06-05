import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const HeroBanner: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      id: 1,
      desktopImage: "/banners/banner1-desktop.webp",
      mobileImage: "/banners/banner1-mobile.webp",
      link: "/anuncios",
      alt: "Descrição do Banner 1",
    },
    {
      id: 2,
      desktopImage: "/banners/banner2-desktop.webp",
      mobileImage: "/banners/banner2-mobile.webp",
      link: "/anuncios",
      alt: "Descrição do Banner 2",
    },
    {
      id: 3,
      desktopImage: "/banners/banner3-desktop.webp",
      mobileImage: "/banners/banner3-mobile.webp",
      link: "/anuncios",
      alt: "Descrição do Banner 3",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="max-w-[1400px] mx-auto px-3 py-4 sm:px-4 sm:py-6">
      <div className="group relative w-full h-[52vw] min-h-[170px] max-h-[220px] sm:h-[380px] sm:max-h-none rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <a href={slide.link} className="block w-full h-full">
              <picture>
                <source media="(max-width: 640px)" srcSet={slide.mobileImage} />
                <img
                  src={slide.desktopImage}
                  alt={slide.alt}
                  className="w-full h-full object-cover select-none"
                />
              </picture>
            </a>
          </div>
        ))}

        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 sm:left-12 sm:translate-x-0 flex items-center gap-2 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                activeSlide === i
                  ? "w-8 sm:w-12 bg-reusehub-orange"
                  : "w-2 sm:w-3 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() =>
            setActiveSlide(
              activeSlide === 0 ? slides.length - 1 : activeSlide - 1,
            )
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-black/15 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/30 group-hover:opacity-100 sm:flex"
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <button
          onClick={() =>
            setActiveSlide(
              activeSlide === slides.length - 1 ? 0 : activeSlide + 1,
            )
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-black/15 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/30 group-hover:opacity-100 sm:flex"
        >
          <ChevronRight size={22} strokeWidth={2.4} />
        </button>
      </div>
    </section>
  );
};
