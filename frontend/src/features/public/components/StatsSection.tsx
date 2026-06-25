import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Building2, Users, Trophy, MapPin } from "lucide-react";

const stats = [
  { icon: Building2, value: 500, suffix: "+", label: "UMKM Terdaftar", color: "text-white", bgColor: "bg-white/20" },
  { icon: Users, value: 50, suffix: "+", label: "Mitra Strategis", color: "text-white", bgColor: "bg-white/20" },
  { icon: Trophy, value: 100, suffix: "+", label: "Program Sukses", color: "text-white", bgColor: "bg-white/20" },
  { icon: MapPin, value: 20, suffix: "+", label: "Kota Jangkauan", color: "text-white", bgColor: "bg-white/20" },
];

function AnimatedCounter({ target, suffix, isVisible }: { target: number; suffix: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, target]);

  return <>{count}{suffix}</>;
}

export default function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-br from-primary via-secondary to-[#1a2f8a] overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-accent uppercase tracking-widest mb-3">
            Dampak Kami
          </span>
          <h2 className="font-poppins text-3xl sm:text-4xl lg:text-[42px] font-bold text-white mb-4">
            Statistik Platform
          </h2>
          <p className="font-inter text-white max-w-2xl mx-auto text-base sm:text-lg">
            Angka yang mencerminkan komitmen kami dalam memberdayakan ekosistem UMKM Indonesia.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-500 text-center"
            >
              <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>

              <p className="font-poppins text-4xl sm:text-5xl font-extrabold text-white mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isInView} />
              </p>
              <p className="font-inter text-white text-sm font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
