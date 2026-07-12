import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: "easeOut" as const },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-visible bg-transparent pt-16">


      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 sm:py-32 lg:py-36 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <div className="text-center lg:text-left">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-semibold rounded-full border border-white/20 mb-6">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                DIGITAL TRANSFORMATION
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.15}
              className="font-poppins text-4xl sm:text-5xl lg:text-6xl xl:text-[68px] font-extrabold text-white leading-[1.05] tracking-tight mb-6"
            >
              Tumbuh Bersama{" "}
              <span className="text-white">di Era Digital</span>
            </motion.h1>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="font-inter text-base sm:text-lg text-white leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
            >
              Memberdayakan UMKM Indonesia melalui inovasi, kemitraan, dan transformasi digital yang berkelanjutan.
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.45}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 bg-accent text-primary font-semibold rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:bg-accent-hover transition-all duration-300 text-sm sm:text-base no-underline"
              >
                Daftar Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => document.querySelector("#tentang")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 text-sm sm:text-base cursor-pointer"
              >
                Pelajari Lebih Lanjut
              </button>
            </motion.div>
          </div>

          {/* Right column — Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Dashboard mockup card */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 h-6 bg-white/10 rounded-lg" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "UMKM", value: "500+", color: "bg-blue-400/20" },
                  { label: "Mitra", value: "50+", color: "bg-green-400/20" },
                  { label: "Program", value: "100+", color: "bg-purple-400/20" },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.color} rounded-xl p-3 text-center`}>
                    <div className="text-white text-xs font-medium">{stat.label}</div>
                    <div className="text-white font-bold text-lg">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Chart placeholder */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-end gap-2 h-32">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.5, delay: 0.6 + i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-accent/40 to-accent rounded-t"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-white">Jan</span>
                  <span className="text-[10px] text-white">Des</span>
                </div>
              </div>
            </div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute -bottom-6 -left-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-[11px] text-white font-medium">Pertumbuhan</div>
                <div className="text-lg font-bold text-white">+128%</div>
                <div className="text-[10px] text-accent font-medium">Yearly</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
