import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Calendar, FileText, Upload, Link as LinkIcon, Search, History, Clock } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Input } from "@trustbank/shared-ui/components/ui/input";
import { Label } from "@trustbank/shared-ui/components/ui/label";
import { Textarea } from "@trustbank/shared-ui/components/ui/textarea";
import { useToast } from "@trustbank/shared-hooks/use-toast";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@trustbank/shared-ui/components/ui/dialog";
import { logAdminAction } from "@trustbank/shared-utils/lib/audit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@trustbank/shared-ui/components/ui/table";
import { sanitizeInput } from "@trustbank/shared-utils/utils/security";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@trustbank/shared-ui/components/Motion";
import { TableSkeleton } from "@trustbank/shared-ui/components/skeletons/DashboardSkeleton";

interface Revision {
  timestamp: string;
  user_id?: string;
  changes: string;
}

interface Post {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  category: string;
  status: "published" | "draft";
  revision_history: Revision[];
  published_at: string;
  created_at: string;
  updated_at: string;
}

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
};

export default function AdminNewsPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  
  // Dialog States
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showHistory, setShowHistory] = useState<Post | null>(null);
  
  // Form States
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Market Briefs");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [publishedAt, setPublishedAt] = useState("");
  const [imageOption, setImageOption] = useState<"url" | "file">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [base64File, setBase64File] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("cms-posts-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data, error } = await (supabase as unknown as any)
        .from("cms_posts")
        .select("*")
        .order("published_at", { ascending: false });
        
      if (error && error.code === "42703") {
        console.warn("CMS schema is missing phase 3 columns. Please run the SQL migration.");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fallbackData = await (supabase as unknown as any).from("cms_posts").select("id, title, summary, content, image_url, category, published_at, created_at").order("published_at", { ascending: false });
        setPosts((fallbackData.data || []).map((p: Record<string, unknown>) => ({ ...p, status: "published", revision_history: [] as Revision[] })));
      } else {
        setPosts((data as Post[]) || []);
      }
    } catch (e) {
      console.error("Error fetching posts:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingPost(null);
    setTitle("");
    setSummary("");
    setContent("");
    setCategory("Market Outlook");
    setStatus("draft");
    setPublishedAt(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm
    setImageOption("url");
    setImageUrl("");
    setBase64File(null);
    setShowForm(true);
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title);
    setSummary(post.summary || "");
    setContent(post.content || "");
    setCategory(post.category);
    setStatus(post.status || "published");
    setPublishedAt(post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
    setImageOption("url");
    setImageUrl(post.image_url || "");
    setBase64File(null);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64File(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast({ title: "Validation Error", description: "Headline is required.", variant: "destructive" });

    try {
      let finalImageUrl = imageUrl;
      if (imageOption === "file" && base64File) {
        finalImageUrl = base64File;
      }

      const publishedDate = new Date(publishedAt).toISOString();

      if (editingPost) {
        const newRevision: Revision = {
          timestamp: new Date().toISOString(),
          changes: "Updated publication contents"
        };
        
        const updatedHistory = [...(editingPost.revision_history || []), newRevision];

        const sanitizedTitle = sanitizeInput(title);
        const sanitizedSummary = summary ? sanitizeInput(summary) : null;
        const sanitizedContent = content ? sanitizeInput(content, true) : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { error } = await (supabase as unknown as any).from("cms_posts").update({
          title: sanitizedTitle,
          slug: generateSlug(sanitizedTitle),
          summary: sanitizedSummary,
          content: sanitizedContent,
          image_url: finalImageUrl || null,
          category,
          status,
          published_at: publishedDate,
          revision_history: updatedHistory,
          updated_at: new Date().toISOString(),
        }).eq("id", editingPost.id);

        if (error) throw error;
        await logAdminAction("edit_news_post", "cms_posts", editingPost.id, { title: sanitizedTitle, status });
        toast({ title: "Publication Updated", description: "The insight has been modified successfully." });
      } else {
        const sanitizedTitle = sanitizeInput(title);
        const sanitizedSummary = summary ? sanitizeInput(summary) : null;
        const sanitizedContent = content ? sanitizeInput(content, true) : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data, error } = await (supabase as unknown as any).from("cms_posts").insert({
          title: sanitizedTitle,
          slug: generateSlug(sanitizedTitle),
          summary: sanitizedSummary,
          content: sanitizedContent,
          image_url: finalImageUrl || null,
          category,
          status,
          published_at: publishedDate,
          revision_history: [{ timestamp: new Date().toISOString(), changes: "Initial draft created" }]
        }).select().single();

        if (error) throw error;
        await logAdminAction("create_news_post", "cms_posts", data.id, { title, status });
        toast({ title: status === "published" ? "Publication Live" : "Draft Saved", description: `The insight has been ${status === "published" ? "distributed" : "saved as draft"}.` });
      }

      setShowForm(false);
      fetchPosts();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Operation Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Are you sure you want to permanently delete "${post.title}"?`)) return;
    try {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { error } = await (supabase as unknown as any).from("cms_posts").delete().eq("id", post.id);
      if (error) throw error;
      await logAdminAction("delete_news_post", "cms_posts", post.id, { title: post.title });
      toast({ title: "Publication Deleted", description: "The insight has been permanently archived." });
      fetchPosts();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Archival Failed", description: err.message, variant: "destructive" });
    }
  };

  const filtered = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === "all" ? true : (p.status || "published") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">Corporate Insights & Content</h1>
          <p className="text-sm text-muted-foreground font-sans">Manage articles, manage drafts, and schedule institutional updates</p>
        </div>
        <Button onClick={handleOpenNew} className="shrink-0 font-bold">
          <Plus className="h-4 w-4 mr-1.5" /> Publish New Insight
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 font-sans justify-between">
        <div className="flex gap-2">
          {(["all", "published", "draft"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors capitalize ${filterStatus === f ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search publications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : (
        <SlideUp className="bg-card rounded-xl border overflow-hidden shadow-sm hover-lift">
          <div className="overflow-x-auto">
            <table className="w-full font-sans">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Media</th>
                  <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Headline & Abstract</th>
                  <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground">Status & Sector</th>
                  <th className="text-left p-4 text-xs font-semibold font-poppins text-muted-foreground hidden md:table-cell">Distribution Date</th>
                  <th className="text-center p-4 text-xs font-semibold font-poppins text-muted-foreground">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((post) => {
                  const displayImg = post.image_url ? post.image_url.replace(".jpg", ".png") : null;
                  const isDraft = (post.status || "published") === "draft";
                  const isScheduled = new Date(post.published_at) > new Date() && !isDraft;

                  return (
                    <tr key={post.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 w-28 align-top">
                        <div className="h-16 w-24 rounded-lg bg-muted overflow-hidden relative border shadow-sm">
                          {displayImg ? (
                            <img src={displayImg} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">No Media</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-sm align-top">
                        <p className="font-bold text-foreground text-sm line-clamp-2 leading-tight">{post.title}</p>
                        <p className="text-xs font-medium text-muted-foreground line-clamp-2 mt-1.5 leading-snug">{post.summary || "No abstract provided."}</p>
                      </td>
                      <td className="p-4 align-top space-y-2">
                        <span className={`text-[10px] border font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider block w-max ${isDraft ? "bg-warning/10 text-yellow-600 border-warning/20" : isScheduled ? "bg-primary/10 text-primary border-blue-500/20" : "bg-success/10 text-success border-emerald-500/20"}`}>
                          {isDraft ? "Draft" : isScheduled ? "Scheduled" : "Published"}
                        </span>
                        <span className="text-[10px] bg-muted/50 border font-bold px-2.5 py-1 rounded-sm uppercase tracking-wider block w-max">
                          {post.category}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold text-muted-foreground hidden md:table-cell align-top">
                        <span className="flex items-center gap-1.5">
                          {isScheduled ? <Clock className="h-3.5 w-3.5 text-primary" /> : <Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
                          {new Date(post.published_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                        {(post.revision_history?.length > 0) && (
                          <p className="text-[10px] mt-1 text-muted-foreground/70 flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => setShowHistory(post)}>
                            <History className="h-3 w-3" /> {post.revision_history.length} revisions
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => handleOpenEdit(post)}>
                            <Edit className="h-4 w-4 text-foreground/75" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(post)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm font-semibold text-muted-foreground">
                      No corporate publications match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SlideUp>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl font-sans max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editingPost ? "Revise Corporate Insight" : "Draft New Corporate Insight"}</DialogTitle>
            <DialogDescription className="mt-1">Construct the publication details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div>
                  <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground">Publication Headline</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 font-semibold" />
                </div>
                
                <div>
                  <Label htmlFor="summary" className="text-xs font-semibold text-muted-foreground">Executive Abstract</Label>
                  <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className="mt-1 resize-none text-sm" />
                </div>

                <div>
                  <Label htmlFor="content" className="text-xs font-semibold text-muted-foreground">Full Publication Body</Label>
                  <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} className="mt-1 text-sm" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg border">
                  <Label className="text-xs font-bold">Publication Status</Label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as "published" | "draft")} className="w-full rounded-md border mt-1.5 p-2 text-sm font-semibold bg-background">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Publish Date</Label>
                  <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="mt-1 text-sm h-9" />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Sector Category</Label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border mt-1 p-2 text-sm bg-background">
                    <option value="Market Briefs">Market Briefs</option>
                    <option value="Corporate Announcements">Corporate Announcements</option>
                    <option value="Macroeconomic Analysis">Macroeconomic Analysis</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-xs font-semibold text-muted-foreground">Media Asset</Label>
                  <div className="flex gap-4 mt-2 mb-2">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="radio" checked={imageOption === "url"} onChange={() => setImageOption("url")} /> URL</label>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="radio" checked={imageOption === "file"} onChange={() => setImageOption("file")} /> Upload</label>
                  </div>
                  {imageOption === "url" ? (
                    <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="text-xs" />
                  ) : (
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="text-xs" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="font-bold">Cancel</Button>
              <Button type="submit" className="font-bold">{editingPost ? "Update Publication" : status === "draft" ? "Save Draft" : "Distribute Insight"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revision History Dialog */}
      <Dialog open={!!showHistory} onOpenChange={(o) => !o && setShowHistory(null)}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="font-poppins">Revision History</DialogTitle>
            <DialogDescription>Changes tracked for "{showHistory?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto p-1">
            {showHistory?.revision_history?.slice().reverse().map((rev, i) => (
              <div key={i} className="flex gap-3 relative pl-4 pb-4 border-l-2 border-muted last:border-primary last:pb-0">
                <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-card" />
                <div>
                  <p className="text-xs font-bold text-foreground">{new Date(rev.timestamp).toLocaleString()}</p>
                  <p className="text-sm mt-1 text-muted-foreground">{rev.changes}</p>
                </div>
              </div>
            ))}
            {(!showHistory?.revision_history || showHistory.revision_history.length === 0) && (
              <p className="text-sm text-center text-muted-foreground py-4">No revisions recorded yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
