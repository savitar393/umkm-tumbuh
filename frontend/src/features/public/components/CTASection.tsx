import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="kontak" className="py-20 sm:py-28 bg-transparent" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative bg-white rounded-3xl p-10 sm:p-16 shadow-xl border border-gray-100 text-center overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-accent/10 rounded-full translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-6 right-10 opacity-10">
            <Sparkles className="w-16 h-16 text-accent" />
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Mulai Sekarang
              </span>
            </motion.div>

            <h2 className="font-poppins text-3xl sm:text-4xl lg:text-5xl font-bold text-dark mb-4 max-w-3xl mx-auto leading-tight">
              Mulai Perjalanan Anda Hari Ini
            </h2>

            <div className="font-inter text-dark text-center text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Jangan biarkan bisnis Anda tertinggal. Bergabunglah dengan ratusan wirausahawan lainnya yang telah bertransformasi bersama UMKM Tumbuh.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-dark font-semibold rounded-full shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:bg-accent-hover transition-all duration-300 text-base no-underline min-w-[200px]"
              >
                Daftar Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a
                href="#kontak"
                className="inline-flex items-center justify-center px-8 py-4 bg-dark text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:bg-black transition-all duration-300 text-base no-underline min-w-[200px]"
              >
                Konsultasi Gratis
              </a>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
