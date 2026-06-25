import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShoppingBag, BarChart3, FileCheck, Users, Database, Heart, TrendingUp, Handshake, ArrowRight, CheckCircle2 } from "lucide-react";

const solutions = [
  {
    badge: "SOLUSI",
    badgeColor: "bg-primary/10 text-primary",
    title: "Untuk Pelaku UMKM",
    description: "Solusi lengkap untuk membantu UMKM berkembang di era digital.",
    items: [
      { icon: ShoppingBag, text: "Akses pasar digital" },
      { icon: BarChart3, text: "Manajemen stok" },
      { icon: FileCheck, text: "Legalitas usaha" },
      { icon: Users, text: "Pendampingan bisnis" },
    ],
    buttonText: "Mulai Sebagai UMKM",
    buttonLink: "/register",
    gradient: "from-primary/5 to-blue-50",
    borderHover: "hover:border-primary/30",
  },
  {
    badge: "KOLABORASI",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    title: "Untuk Mitra",
    description: "Peluang kolaborasi strategis untuk pertumbuhan bersama.",
    items: [
      { icon: Database, text: "Database UMKM terverifikasi" },
      { icon: Heart, text: "Program CSR" },
      { icon: TrendingUp, text: "Peluang investasi" },
      { icon: Handshake, text: "Kolaborasi strategis" },
    ],
    buttonText: "Jadi Mitra",
    buttonLink: "/register",
    gradient: "from-emerald-500/5 to-green-50",
    borderHover: "hover:border-emerald-500/30",
  },
];

export default function SolutionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="kemitraan" className="py-20 sm:py-28 bg-background" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-dark uppercase tracking-widest mb-3">
            Solusi Terpadu
          </span>
          <h2 className="font-poppins text-3xl sm:text-4xl lg:text-[42px] font-bold text-dark mb-4">
            Solusi Kami
          </h2>
          <p className="font-inter text-dark text-center max-w-2xl mx-auto text-base sm:text-lg">
            Dua jalur solusi yang dirancang untuk mempertemukan pelaku UMKM dengan mitra strategis.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {solutions.map((sol, index) => (
            <motion.div
              key={sol.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`group relative bg-gradient-to-br ${sol.gradient} rounded-2xl p-7 sm:p-9 border border-gray-100 ${sol.borderHover} hover:shadow-xl transition-all duration-500`}
            >
              <span className={`inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${sol.badgeColor} mb-5`}>
                {sol.badge}
              </span>

              <h3 className="font-poppins text-2xl sm:text-[26px] font-bold text-dark mb-2">
                {sol.title}
              </h3>
              <p className="font-inter text-gray-700 text-[15px] mb-7">
                {sol.description}
              </p>

              <ul className="space-y-4 mb-8">
                {sol.items.map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-inter text-dark text-[15px]">{item.text}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={sol.buttonLink}
                className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all duration-300 no-underline group/btn"
              >
                {sol.buttonText}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
