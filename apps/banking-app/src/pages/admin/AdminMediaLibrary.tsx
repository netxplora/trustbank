import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon, File as FileIcon, Copy, CheckCircle2, Folder, ChevronRight, LayoutGrid, List, Search, Info, X } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { logAdminAction } from "@trustbank/shared-utils/lib/audit";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

export default function AdminMediaLibrary() {
  const { toast } = useToast();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  const [currentPath, setCurrentPath] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "images" | "documents">("all");
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    setSelectedFile(null);
    try {
      const { data, error } = await supabase.storage.from("cms_media").list(path || undefined, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });
      
      if (error) throw error;
      
      // Separate folders from files. Folders don't have IDs.
      const foundFolders = data?.filter(f => !f.id && f.name !== ".emptyFolderPlaceholder").map(f => f.name) || [];
      const foundFiles = data?.filter(f => f.id && f.name !== ".emptyFolderPlaceholder") || [];
      
      setFolders(foundFolders);
      setFiles(foundFiles as any);
    } catch (err: any) {
      console.error("Error fetching media:", err);
      toast({ title: "Failed to load media", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = event.target.files;
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i];
      try {
        // Strict MIME validation for media library
        const allowedMediaTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          'application/pdf', 'image/avif'
        ];
        if (!allowedMediaTypes.includes(file.type)) {
          throw new Error(`File ${file.name} has an unsupported type (${file.type}).`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the 10MB size limit.`);
        }

        const ext = file.name.split('.').pop();
        const baseName = file.name.replace(`.${ext}`, "").replace(/[^a-zA-Z0-9]/g, "-");
        const cleanName = `${baseName}_${Math.random().toString(36).substring(7)}.${ext}`;
        const fullPath = currentPath ? `${currentPath}/${cleanName}` : cleanName;

        const { error } = await supabase.storage.from("cms_media").upload(fullPath, file);
        if (error) throw error;

        await logAdminAction("upload_media", "storage.objects", fullPath, { size: file.size, type: file.type });
        successCount++;
      } catch (err: any) {
        console.error(`Upload failed for ${file.name}:`, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast({ title: "Upload Complete", description: `Successfully uploaded ${successCount} asset(s).` });
      fetchFiles(currentPath);
    }
    if (failCount > 0) {
      toast({ title: "Upload Incomplete", description: `${failCount} file(s) failed to upload.`, variant: "destructive" });
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter new folder name (lowercase, no spaces):");
    if (!name) return;
    
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const fullPath = currentPath ? `${currentPath}/${cleanName}/.emptyFolderPlaceholder` : `${cleanName}/.emptyFolderPlaceholder`;
    
    try {
      // Create a dummy file to instantiate the folder
      const dummyFile = new Blob([""], { type: "text/plain" });
      const { error } = await supabase.storage.from("cms_media").upload(fullPath, dummyFile);
      if (error) throw error;
      
      toast({ title: "Folder Created", description: `Folder '${cleanName}' created successfully.` });
      fetchFiles(currentPath);
    } catch (err: any) {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (fileName: string, isFolder = false) => {
    if (!confirm(`Are you sure you want to delete this ${isFolder ? "folder" : "asset"}? This may break existing links on the website.`)) return;

    try {
      const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;
      
      if (isFolder) {
        // Must delete all files inside the folder first
        const { data } = await supabase.storage.from("cms_media").list(fullPath);
        if (data && data.length > 0) {
          const filesToDelete = data.map(f => `${fullPath}/${f.name}`);
          await supabase.storage.from("cms_media").remove(filesToDelete);
        }
      } else {
        const { error } = await supabase.storage.from("cms_media").remove([fullPath]);
        if (error) throw error;
      }

      toast({ title: "Deleted", description: "The item has been permanently removed." });
      await logAdminAction("delete_media", "storage.objects", fullPath);
      fetchFiles(currentPath);
      setSelectedFile(null);
    } catch (err: any) {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    }
  };

  const getPublicUrl = (fileName: string) => {
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;
    const { data } = supabase.storage.from("cms_media").getPublicUrl(fullPath);
    return data.publicUrl;
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({ title: "Copied", description: "Asset URL copied to clipboard." });
  };

  // Filter files
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isImage = f.metadata?.mimetype?.startsWith("image/") || f.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
    const matchesType = filterType === "all" ? true : filterType === "images" ? isImage : !isImage;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Media Library</h1>
          <p className="text-sm text-muted-foreground font-sans">Organize your content assets, images, and documents</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateFolder} className="font-bold">
            <Folder className="h-4 w-4 mr-2" /> New Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="font-bold">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Assets"}
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" multiple onChange={handleFileUpload} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-card p-3 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto text-sm font-semibold text-muted-foreground whitespace-nowrap px-2">
          <button onClick={() => setCurrentPath("")} className={`hover:text-primary transition-colors ${!currentPath ? "text-foreground" : ""}`}>Library</button>
          {currentPath.split('/').filter(Boolean).map((part, index, arr) => {
            const path = arr.slice(0, index + 1).join('/');
            return (
              <span key={path} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 opacity-50" />
                <button onClick={() => setCurrentPath(path)} className={`hover:text-primary transition-colors ${index === arr.length - 1 ? "text-foreground" : ""}`}>
                  {part}
                </button>
              </span>
            );
          })}
        </div>

        <div className="flex gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 w-[200px] pl-8 text-xs" />
          </div>
          <select value={filterType} onChange={(e: any) => setFilterType(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-xs font-semibold">
            <option value="all">All Types</option>
            <option value="images">Images Only</option>
            <option value="documents">Documents</option>
          </select>
          <div className="flex border rounded-md overflow-hidden bg-background">
            <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <SlideUp className={`bg-card border rounded-xl shadow-sm p-6 min-h-[500px] ${selectedFile ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {loading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 w-full bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            )
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full border-2 border-dashed rounded-xl bg-muted/20 py-20">
              <Upload className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="font-bold text-foreground">This folder is empty</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-4">Upload images and documents here to use them across your site.</p>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} className="font-bold">Select Files</Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {/* Folders */}
              {folders.map((folder) => (
                <div key={folder} onClick={() => setCurrentPath(currentPath ? `${currentPath}/${folder}` : folder)} className="group border rounded-lg p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-all text-center">
                  <Folder className="h-10 w-10 text-primary group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold text-foreground truncate w-full">{folder}</span>
                </div>
              ))}
              
              {/* Files */}
              {filteredFiles.map((file) => {
                const url = getPublicUrl(file.name);
                const isImage = file.metadata?.mimetype?.startsWith("image/") || file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
                const isSelected = selectedFile?.name === file.name;
                
                return (
                  <div key={file.id} onClick={() => setSelectedFile(file)} className={`group border rounded-lg overflow-hidden transition-all cursor-pointer ${isSelected ? "ring-2 ring-primary border-transparent" : "hover:shadow-md hover:border-primary/30"}`}>
                    <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
                      {isImage ? (
                        <img src={url} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon className="h-10 w-10 text-muted-foreground/50" />
                      )}
                      
                      {/* Hover Actions */}
                      <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-2 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); copyToClipboard(url); }} title="Copy URL">
                          {copiedUrl === url ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="p-2.5 bg-background">
                      <p className="text-[10px] font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 uppercase">{(file.metadata?.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="border-b bg-muted/20 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                    <th className="p-3 w-10"></th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {folders.map(folder => (
                    <tr key={folder} onClick={() => setCurrentPath(currentPath ? `${currentPath}/${folder}` : folder)} className="hover:bg-muted/20 cursor-pointer transition-colors group">
                      <td className="p-3"><Folder className="h-5 w-5 text-primary group-hover:text-primary" /></td>
                      <td className="p-3 font-bold">{folder}</td>
                      <td className="p-3 text-muted-foreground">-</td>
                      <td className="p-3 text-muted-foreground">Folder</td>
                      <td className="p-3 text-muted-foreground">-</td>
                    </tr>
                  ))}
                  {filteredFiles.map(file => {
                    const isImage = file.metadata?.mimetype?.startsWith("image/") || file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
                    const isSelected = selectedFile?.name === file.name;
                    return (
                      <tr key={file.id} onClick={() => setSelectedFile(file)} className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/10"}`}>
                        <td className="p-3">{isImage ? <ImageIcon className="h-5 w-5 text-muted-foreground" /> : <FileIcon className="h-5 w-5 text-muted-foreground" />}</td>
                        <td className="p-3 font-semibold text-foreground truncate max-w-[200px]">{file.name}</td>
                        <td className="p-3 text-xs text-muted-foreground uppercase">{(file.metadata?.size / 1024).toFixed(1)} KB</td>
                        <td className="p-3 text-xs text-muted-foreground uppercase">{file.metadata?.mimetype || "Unknown"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{new Date(file.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SlideUp>

        {/* Details Panel */}
        {selectedFile && (
          <FadeIn className="lg:sticky lg:top-4 h-max">
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 border-b flex items-center justify-between bg-muted/20">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Info className="h-4 w-4" /> Details</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setSelectedFile(null)}><X className="h-4 w-4" /></Button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                {selectedFile.metadata?.mimetype?.startsWith("image/") || selectedFile.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                  <img src={getPublicUrl(selectedFile.name)} alt={selectedFile.name} className="w-full h-full object-contain" />
                ) : (
                  <FileIcon className="h-16 w-16 text-muted-foreground/30" />
                )}
              </div>

              <div className="space-y-3 font-sans text-sm">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Filename</p>
                  <p className="font-semibold break-words leading-tight mt-0.5">{selectedFile.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Size</p>
                    <p className="font-semibold text-xs mt-0.5 uppercase">{(selectedFile.metadata?.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Type</p>
                    <p className="font-semibold text-xs mt-0.5 uppercase">{selectedFile.metadata?.mimetype}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Uploaded</p>
                  <p className="font-semibold text-xs mt-0.5">{new Date(selectedFile.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Public URL</p>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={getPublicUrl(selectedFile.name)} className="text-[10px] h-8 bg-muted font-mono" />
                    <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => copyToClipboard(getPublicUrl(selectedFile.name))}>
                      {copiedUrl === getPublicUrl(selectedFile.name) ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t mt-4 flex gap-2">
                <Button variant="outline" className="flex-1 text-xs font-bold" onClick={() => window.open(getPublicUrl(selectedFile.name), "_blank")}>
                  Open in New Tab
                </Button>
                <Button variant="destructive" className="flex-1 text-xs font-bold" onClick={() => handleDelete(selectedFile.name)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
