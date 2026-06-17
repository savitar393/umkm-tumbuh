interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#64748b" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14 }}>Halaman ini sedang dalam pengembangan</p>
    </div>
  );
}
