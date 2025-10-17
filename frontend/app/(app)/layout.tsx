import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProtectedRoute } from "@/components/protected-route";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-slate-950">{children}</main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
