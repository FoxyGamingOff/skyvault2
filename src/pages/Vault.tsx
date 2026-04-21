import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Cloud, LogOut, Search, HardDrive } from "lucide-react";
import UploadDropzone from "@/components/vault/UploadDropzone";
import FileCard, { type VaultFile } from "@/components/vault/FileCard";

const Vault = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Skyvault — Your Files";
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) navigate("/auth", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate("/auth", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("files")
      .select("id, name, storage_path, mime_type, size_bytes, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load files", description: error.message, variant: "destructive" });
    } else {
      setFiles(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) loadFiles();
  }, [session]);

  const handleUpload = async (selected: File[]) => {
    if (!session) return;
    setUploading(true);
    let okCount = 0;
    for (const f of selected) {
      const safeName = f.name.replace(/[^\w.\-]/g, "_");
      const path = `${session.user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("vault").upload(path, f, {
        contentType: f.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) {
        toast({ title: `Failed: ${f.name}`, description: upErr.message, variant: "destructive" });
        continue;
      }
      const { error: dbErr } = await supabase.from("files").insert({
        user_id: session.user.id,
        name: f.name,
        storage_path: path,
        mime_type: f.type || null,
        size_bytes: f.size,
      });
      if (dbErr) {
        await supabase.storage.from("vault").remove([path]);
        toast({ title: `Failed: ${f.name}`, description: dbErr.message, variant: "destructive" });
        continue;
      }
      okCount++;
    }
    setUploading(false);
    if (okCount > 0) {
      toast({ title: `Uploaded ${okCount} file${okCount > 1 ? "s" : ""}` });
      loadFiles();
    }
  };

  const handleDelete = async (file: VaultFile) => {
    const prev = files;
    setFiles((f) => f.filter((x) => x.id !== file.id));
    const { error: sErr } = await supabase.storage.from("vault").remove([file.storage_path]);
    const { error: dErr } = await supabase.from("files").delete().eq("id", file.id);
    if (sErr || dErr) {
      setFiles(prev);
      toast({ title: "Delete failed", description: (sErr ?? dErr)?.message, variant: "destructive" });
    } else {
      toast({ title: "File deleted" });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const filtered = useMemo(
    () => files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [files, query]
  );

  const totalBytes = files.reduce((s, f) => s + f.size_bytes, 0);
  const totalGB = (totalBytes / 1024 / 1024 / 1024).toFixed(2);

  return (
    <main className="relative min-h-screen bg-soft-gradient">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-sky-gradient opacity-20 blur-3xl" />

      <header className="relative z-10 border-b border-border/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-gradient shadow-glow">
              <Cloud className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Skyvault</h1>
              <p className="text-xs text-muted-foreground">{session?.user.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Your Vault</h2>
            <p className="mt-1 text-muted-foreground">All your files, beautifully organized.</p>
          </div>
          <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3 shadow-soft">
            <HardDrive className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <span className="font-semibold">{files.length}</span> files · <span className="font-semibold">{totalGB}</span> GB
            </span>
          </div>
        </div>

        <div className="mb-8">
          <UploadDropzone onFiles={handleUpload} uploading={uploading} />
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your files…"
              className="h-12 rounded-2xl pl-11"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-3xl p-16 text-center shadow-soft">
            <Cloud className="mx-auto h-12 w-12 text-primary/60" strokeWidth={1.2} />
            <h3 className="mt-4 text-lg font-semibold">
              {files.length === 0 ? "Your vault is empty" : "No matches"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {files.length === 0 ? "Upload your first file to get started." : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((f) => (
              <FileCard key={f.id} file={f} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Vault;