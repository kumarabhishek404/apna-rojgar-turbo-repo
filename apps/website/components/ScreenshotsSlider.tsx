"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectCoverflow } from "swiper/modules";
import Image from "next/image";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

export default function ScreenshotsCarousel() {
  const images = [
    "/screenshots/screenshot1.webp",
    "/screenshots/screenshot1.webp",
    "/screenshots/screenshot1.webp",
    "/screenshots/screenshot1.webp",
    "/screenshots/screenshot1.webp",
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-20 text-center">

        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          App Screenshots
        </h2>

        <p className="text-gray-600 max-w-xl mx-auto mb-16">
          Discover how Apna Rojgar helps workers and businesses connect
          seamlessly through a simple and powerful mobile experience.
        </p>

        <Swiper
          modules={[Navigation, EffectCoverflow]}
          effect="coverflow"
          centeredSlides
          slidesPerView={1.4}
          spaceBetween={40}
          loop
          navigation
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 120,
            modifier: 2,
            slideShadows: false,
          }}
          breakpoints={{
            768: {
              slidesPerView: 2.2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="pb-10"
        >
          {images.map((img, i) => (
            <SwiperSlide key={i} className="flex justify-center">
              <div className="relative transition-all duration-500 hover:scale-105">
                <Image
                  src={img}
                  width={320}
                  height={640}
                  alt="Apna Rojgar App"
                  className="rounded-3xl shadow-2xl border border-gray-200"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}