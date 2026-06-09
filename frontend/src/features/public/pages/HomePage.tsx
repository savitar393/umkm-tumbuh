import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-card">
        <h1>UMKM Tumbuh</h1>
        <p>Platform pengembangan UMKM berbasis pelatihan, kemitraan, dan monitoring usaha.</p>

        <div className="button-row">
          <Link className="button" to="/login">Login</Link>
          <Link className="button secondary" to="/register">Daftar</Link>
        </div>
      </section>
    </main>
  );
}
