import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Cloud, Lock, Upload, Globe } from "lucide-react";

const features = [
  { icon: Lock, title: "Private by default", desc: "End-to-end RLS. Only you can access your files." },
  { icon: Upload, title: "Drag, drop, done", desc: "Upload anything from any device, instantly." },
  { icon: Globe, title: "Anywhere access", desc: "Your home WiFi or across the world — same vault." },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Skyvault — Your Personal Cloud";
    const desc = "Your private cloud for files, photos, and documents. Secure, beautiful, accessible anywhere.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/vault");
    });
  }, [navigate]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-soft-gradient">
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-sky-gradient opacity-30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[560px] w-[560px] rounded-full bg-sky-gradient opacity-25 blur-3xl" />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-gradient shadow-glow">
            <Cloud className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Skyvault</span>
        </div>
        <Link to="/auth">
          <Button variant="ghost" className="rounded-xl">Sign in</Button>
        </Link>
      </nav>

      <section className="relative mx-auto max-w-4xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <div className="mx-auto mb-8 inline-flex animate-float items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-gradient shadow-glow">
            <Cloud className="h-10 w-10 text-primary-foreground" strokeWidth={1.6} />
          </div>
        </div>

        <h1 className="animate-fade-in-up text-balance text-5xl font-extrabold tracking-tight sm:text-7xl">
          Your private cloud,
          <br />
          <span className="bg-sky-gradient bg-clip-text text-transparent">beautifully simple.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl animate-fade-in-up text-balance text-lg text-muted-foreground">
          Store your photos, documents, and memories. Yours alone, accessible from anywhere.
        </p>

        <div className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/auth">
            <Button size="lg" className="h-12 rounded-xl bg-sky-gradient px-8 text-base font-semibold shadow-elegant hover:opacity-95">
              Get started — it's free
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="ghost" className="h-12 rounded-xl px-6 text-base">
              I have an account
            </Button>
          </Link>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="glass animate-fade-in-up rounded-2xl p-6 shadow-soft">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Index;
