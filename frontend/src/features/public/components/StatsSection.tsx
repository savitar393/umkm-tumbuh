import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Building2, Users, Trophy, MapPin } from "lucide-react";

const stats = [
  { value: 500, suffix: "+", label: "UMKM Tergabung" },
  { value: 50, suffix: "+", label: "Mitra Strategis" },
  { value: 100, suffix: "+", label: "Program Sukses" },
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
    <section className="relative py-20 sm:py-28 bg-transparent overflow-hidden" ref={ref}>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="hidden"
        >
          <span className="hidden">
            Dampak Kami
          </span>
          <h2 className="hidden">
            Statistik Platform
          </h2>
          <p className="hidden">
            Angka yang mencerminkan komitmen kami dalam memberdayakan ekosistem UMKM Indonesia.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="font-poppins text-4xl sm:text-5xl font-extrabold text-white mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} isVisible={isInView} />
              </div>
              <div className="font-inter text-white text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
