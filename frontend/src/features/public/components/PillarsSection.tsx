import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Monitor, Handshake, GraduationCap } from "lucide-react";

const pillars = [
  {
    icon: Monitor,
    title: "Transformasi Digital",
    description: "Modernisasi operasional bisnis UMKM dengan teknologi digital terkini untuk meningkatkan efisiensi dan daya saing.",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Handshake,
    title: "Kemitraan Strategis",
    description: "Menghubungkan UMKM dengan jaringan korporasi dan investor untuk memperluas peluang bisnis dan kolaborasi.",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: GraduationCap,
    title: "Pelatihan",
    description: "Program pelatihan dan pendampingan bisnis yang berkelanjutan untuk meningkatkan kapasitas manajerial dan teknis.",
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

export default function PillarsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="tentang" className="py-20 sm:py-28 bg-transparent" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-white/80 uppercase tracking-widest mb-3">
            Fondasi Kami
          </span>
          <h2 className="font-poppins text-3xl sm:text-4xl lg:text-[42px] font-bold text-white mb-4">
            Pilar Utama Kami
          </h2>
          <div className="w-16 h-1 bg-accent mx-auto mb-6 rounded-full"></div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative bg-white rounded-2xl p-7 sm:p-8 border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-500 cursor-default"
            >
              {/* Gradient top border on hover */}
              <div className={`absolute top-0 left-6 right-6 h-1 bg-gradient-to-r ${pillar.color} rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className={`w-14 h-14 ${pillar.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <pillar.icon className={`w-7 h-7 ${pillar.iconColor}`} />
              </div>

              <h3 className="font-poppins text-xl font-bold text-dark mb-3">
                {pillar.title}
              </h3>
              <div className="font-inter text-gray-700 leading-relaxed text-[15px]">
                {pillar.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
