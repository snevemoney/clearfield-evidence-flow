import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export function DocumentUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).filter((f) =>
      f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    setFiles((prev) => [...prev, ...selected]);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    setStatus("Uploading files...");

    try {
      const fileUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `uploads/${Date.now()}-${file.name}`;
        setStatus(`Uploading ${i + 1}/${files.length}: ${file.name}`);
        setProgress(((i) / files.length) * 50);

        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) {
          console.error("Upload error:", error);
          continue;
        }

        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        fileUrls.push(urlData.publicUrl);
      }

      setProgress(60);
      setStatus("Processing documents with AI OCR...");

      const { data, error } = await supabase.functions.invoke("ingest-bulk-documents", {
        body: {
          file_urls: fileUrls,
          source: sourceLabel || "Uploaded Documents",
        },
      });

      if (error) throw error;

      setProgress(100);
      setStatus("Complete!");
      toast({
        title: "Documents ingested",
        description: `${data.documents_processed} documents, ${data.total_pages} pages extracted, ${data.redacted_pages} with redactions`,
      });

      setFiles([]);
      setSourceLabel("");
      setTimeout(() => {
        setProgress(0);
        setStatus("");
      }, 3000);
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
      setStatus("Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-border rounded-sm bg-card mb-4">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 font-mono text-[10px] tracking-widest text-muted-foreground hover:text-foreground transition-all"
      >
        <div className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5 text-primary" />
          <span>INGEST DOCUMENTS</span>
        </div>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Source label */}
          <div>
            <label className="font-mono text-[9px] text-muted-foreground tracking-wider block mb-1">SOURCE LABEL</label>
            <input
              type="text"
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="e.g., DOJ Epstein Release 2024"
              className="w-full bg-secondary border border-border rounded-sm px-3 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 outline-none"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-sm p-6 text-center hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider">
              DROP PDF FILES HERE OR CLICK TO SELECT
            </p>
            <p className="font-mono text-[8px] text-muted-foreground/50 mt-1">Supports bulk upload</p>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-muted-foreground/50">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-destructive hover:text-destructive/80 text-[8px]"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {(uploading || progress > 0) && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="font-mono text-[9px] text-muted-foreground flex items-center gap-1.5">
                {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                {status}
              </p>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full py-2 rounded-sm font-mono text-[10px] tracking-widest bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-30 transition-all"
          >
            {uploading ? "PROCESSING..." : `INGEST ${files.length} FILE${files.length !== 1 ? "S" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
