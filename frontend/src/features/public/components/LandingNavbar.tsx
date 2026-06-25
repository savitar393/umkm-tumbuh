import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "../../../assets/umkm-tumbuh.webp";
import { getCurrentUser, clearAuthStorage, getDefaultRouteByRole } from "../../../shared/auth/currentUser";

const navLinks = [
  { label: "Beranda", to: "/" },
  { label: "Tentang Kami", href: "#tentang" },
  { label: "Kontak", href: "#kontak" },
];

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/login");
  };

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <img
              src={logoImg}
              alt="UMKM Tumbuh"
              className="h-9 sm:h-10 w-auto"
            />
            <span className="font-poppins font-bold text-base sm:text-lg tracking-tight text-primary transition-colors duration-300">
              UMKM Tumbuh
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.to ? location.pathname === link.to : false;
              return link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`font-inter text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 no-underline ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-gray-600 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href!)}
                  className="font-inter text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 bg-transparent border-0 cursor-pointer text-gray-600 hover:text-primary hover:bg-primary/5"
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              /* Logged in state */
              <div ref={profileRef} className="relative hidden lg:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 bg-transparent border-0 cursor-pointer ${
                    scrolled ? "hover:bg-gray-50" : "hover:bg-white/10"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-yellow-500 flex items-center justify-center shadow-md">
                    <User className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      scrolled ? "text-dark" : "text-white"
                    }`}
                  >
                    {user.full_name || "User"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-all ${
                      profileOpen ? "rotate-180" : ""
                    } ${scrolled ? "text-gray-400" : "text-white/60"}`}
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-sm font-bold text-dark">{user.full_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                        <span className="inline-block mt-2 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {user.role}
                        </span>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => { navigate(getDefaultRouteByRole(user.role)); setProfileOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition bg-transparent border-0 cursor-pointer text-left"
                        >
                          <LayoutDashboard className="w-4 h-4 text-primary" />
                          Dashboard
                        </button>
                      </div>
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition bg-transparent border-0 cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Keluar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Not logged in */
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  to="/login"
                  className="font-inter text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 no-underline text-primary hover:bg-primary/5"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="font-inter text-sm font-semibold px-5 py-2.5 rounded-xl bg-accent text-dark hover:bg-accent-hover transition-all duration-200 no-underline shadow-md hover:shadow-lg"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all border-0 cursor-pointer bg-gray-100 text-dark"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-primary/5 hover:text-primary transition no-underline"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.label}
                    onClick={() => scrollToSection(link.href!)}
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-primary/5 hover:text-primary transition bg-transparent border-0 cursor-pointer"
                  >
                    {link.label}
                  </button>
                )
              )}
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      to={getDefaultRouteByRole(user.role)}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm no-underline"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold text-sm border-0 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center px-4 py-3 text-primary font-semibold text-sm rounded-xl border border-primary/20 hover:bg-primary/5 transition no-underline"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center px-4 py-3 bg-accent text-dark font-semibold text-sm rounded-xl hover:bg-accent-hover transition no-underline"
                    >
                      Daftar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
