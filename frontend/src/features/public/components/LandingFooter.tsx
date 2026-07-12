import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import logoImg from "../../../assets/umkm-tumbuh.webp";

const navigation = [
  { label: "Beranda", to: "/" },
  { label: "Tentang Kami", href: "#tentang" },
  { label: "Kontak", href: "#kontak" },
];

const legal = [
  { label: "Kebijakan Privasi", to: "#" },
  { label: "Syarat & Ketentuan", to: "#" },
];

const socials = [
  { icon: "mdi:instagram", label: "Instagram", href: "#" },
  { icon: "mdi:facebook", label: "Facebook", href: "#" },
  { icon: "mdi:linkedin", label: "LinkedIn", href: "#" },
];

export default function LandingFooter() {
  return (
    <footer className="bg-gradient-to-br from-[#0f1b4d] via-[#142266] to-[#0d1540] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <img src={logoImg} alt="UMKM Tumbuh" className="h-9 w-auto" />
              <span className="font-poppins font-bold text-lg text-white">UMKM Tumbuh</span>
            </div>
            <div className="font-inter text-white/80 text-sm leading-relaxed max-w-xs">
              Platform pemberdayaan ekonomi terpadu untuk mengakselerasi pertumbuhan UMKM di seluruh pelosok Indonesia.
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-poppins font-bold text-sm text-white mb-5 uppercase tracking-wider">
              Navigasi
            </h4>
            <ul className="space-y-3 list-none p-0 m-0">
              {navigation.map((nav) => (
                <li key={nav.label}>
                  {nav.to ? (
                    <Link
                      to={nav.to}
                      className="font-inter text-white/80 hover:text-accent text-sm transition-colors duration-200 no-underline"
                    >
                      {nav.label}
                    </Link>
                  ) : (
                    <a
                      href={nav.href}
                      className="font-inter text-white/80 hover:text-accent text-sm transition-colors duration-200 no-underline"
                    >
                      {nav.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-poppins font-bold text-sm text-white mb-5 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3 list-none p-0 m-0">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="font-inter text-white/80 hover:text-accent text-sm transition-colors duration-200 no-underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-poppins font-bold text-sm text-white mb-5 uppercase tracking-wider">
              Sosial Media
            </h4>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 hover:bg-accent hover:text-dark transition-all duration-300 no-underline"
                >
                  <Icon icon={social.icon} className="w-4.5 h-4.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/10">
          <p className="font-inter text-white/60 text-sm text-center">
            © 2026 UMKM Tumbuh. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
