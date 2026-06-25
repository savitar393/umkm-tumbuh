import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    text: "Program ini membantu kami meningkatkan omzet hingga 2x lipat. Sistem manajemen stok dan akses pasar digital benar-benar mengubah bisnis kami.",
    name: "Budi Santoso",
    role: "Pemilik UMKM Makanan",
    avatar: "BS",
    rating: 5,
  },
  {
    text: "Kemitraan strategis yang difasilitasi UMKM Tumbuh membuka akses ke pasar baru yang sebelumnya tidak terjangkau oleh usaha kecil kami.",
    name: "Siti Rahayu",
    role: "Pengrajin Batik Tulis",
    avatar: "SR",
    rating: 5,
  },
  {
    text: "Pelatihan digital yang diberikan sangat praktis dan langsung bisa diterapkan. Tim pendamping selalu siap membantu kapan saja.",
    name: "Ahmad Fauzi",
    role: "Pemilik Toko Online",
    avatar: "AF",
    rating: 5,
  },
  {
    text: "Sebagai mitra korporasi, kami menemukan banyak UMKM berkualitas melalui platform ini. Kolaborasi yang saling menguntungkan.",
    name: "Diana Putri",
    role: "CSR Manager, PT Nusantara",
    avatar: "DP",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-20 sm:py-28 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-dark uppercase tracking-widest mb-3">
            Testimoni
          </span>
          <h2 className="font-poppins text-3xl sm:text-4xl lg:text-[42px] font-bold text-dark mb-4">
            Cerita Sukses Mereka
          </h2>
          <div className="font-inter text-dark text-center max-w-2xl mx-auto text-base sm:text-lg">
            Dengarkan langsung dari pelaku UMKM dan mitra yang telah merasakan manfaat platform kami.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Main testimonial card */}
          <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-lg overflow-hidden">
            {/* Quote icon */}
            <Quote className="absolute top-6 right-6 w-12 h-12 text-primary/10" />

            <div className="relative">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Text */}
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="font-inter text-dark text-lg sm:text-xl leading-relaxed mb-8 italic"
              >
                "{testimonials[currentIndex].text}"
              </motion.div>

              {/* Author */}
              <motion.div
                key={`author-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {testimonials[currentIndex].avatar}
                </div>
                <div>
                  <div className="font-poppins font-bold text-dark text-base">
                    {testimonials[currentIndex].name}
                  </div>
                  <div className="font-inter text-dark text-sm">
                    {testimonials[currentIndex].role}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-gray-600 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 border-0 cursor-pointer ${
                    i === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-gray-600 cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
