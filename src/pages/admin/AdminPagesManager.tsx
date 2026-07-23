import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit, Trash2, Globe, ChevronDown, ChevronUp, Save, Eye, EyeOff,
  Layout, Type, Grid3X3, Megaphone, BarChart3, ImageIcon, HelpCircle, MessageSquareQuote,
  ArrowLeft, GripVertical, Search, X, ExternalLink, Copy, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/audit";
import { Switch } from "@/components/ui/switch";

// ─── Types ───────────────────────────────────────────────────────
interface Page {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_blocks: ContentBlock[];
  seo_metadata: SeoMeta;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface SeoMeta {
  meta_title?: string;
  meta_description?: string;
}

interface ContentBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
}

type BlockType =
  | "hero"
  | "text"
  | "features"
  | "cta"
  | "stats"
  | "gallery"
  | "faq"
  | "testimonials";

// ─── Block Palette Config ────────────────────────────────────────
const BLOCK_PALETTE: { type: BlockType; label: string; icon: any; description: string }[] = [
  { type: "hero", label: "Hero Section", icon: Layout, description: "Full-width banner with headline, subtitle, and call-to-action" },
  { type: "text", label: "Text Content", icon: Type, description: "Rich text section with title and body content" },
  { type: "features", label: "Features Grid", icon: Grid3X3, description: "Grid of feature cards with icons and descriptions" },
  { type: "cta", label: "CTA Banner", icon: Megaphone, description: "Call-to-action banner with button" },
  { type: "stats", label: "Stats Counter", icon: BarChart3, description: "Numeric statistics display" },
  { type: "gallery", label: "Image Gallery", icon: ImageIcon, description: "Grid of images with captions" },
  { type: "faq", label: "FAQ Accordion", icon: HelpCircle, description: "Frequently asked questions section" },
  { type: "testimonials", label: "Testimonials", icon: MessageSquareQuote, description: "Customer testimonial cards" },
];

function getDefaultContent(type: BlockType): Record<string, any> {
  switch (type) {
    case "hero": return { headline: "", subheadline: "", cta_text: "", cta_link: "", bg_image: "" };
    case "text": return { title: "", body: "", alignment: "left" };
    case "features": return { title: "", items: [{ icon: "Shield", title: "", description: "" }] };
    case "cta": return { headline: "", description: "", button_text: "", button_link: "", bg_color: "#1e3a5f" };
    case "stats": return { title: "", items: [{ value: "", label: "" }] };
    case "gallery": return { title: "", images: [{ url: "", caption: "" }] };
    case "faq": return { title: "", items: [{ question: "", answer: "" }] };
    case "testimonials": return { title: "", items: [{ name: "", role: "", quote: "", rating: 5 }] };
  }
}

// ─── Main Component ──────────────────────────────────────────────
export default function AdminPagesManager() {
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPages();

    const channel = supabase
      .channel("cms-pages-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_pages" }, () => {
        fetchPages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cms_pages").select("*").order("slug");
      if (error) throw error;
      setPages(data as Page[]);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load pages.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    const slug = prompt("Enter page slug (e.g., 'promotions', 'careers', 'contact'):");
    if (!slug) return;

    try {
      const { data, error } = await supabase.from("cms_pages").insert({
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        title: "New Page",
        content_blocks: [],
        seo_metadata: {},
        is_published: false,
      }).select().single();

      if (error) throw error;
      await logAdminAction("create_page", "cms_pages", data.id, { slug });
      setPages([...pages, data as Page]);
      setEditingPage(data as Page);
      toast({ title: "Page Created", description: "Start adding content blocks." });
    } catch (err: any) {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeletePage = async (page: Page) => {
    if (!confirm(`Permanently delete the page "/${page.slug}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("cms_pages").delete().eq("id", page.id);
      if (error) throw error;
      await logAdminAction("delete_page", "cms_pages", page.id, { slug: page.slug });
      setPages(pages.filter(p => p.id !== page.id));
      toast({ title: "Page Deleted", description: `/${page.slug} has been removed.` });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSavePage = async () => {
    if (!editingPage) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("cms_pages").update({
        title: editingPage.title,
        description: editingPage.description,
        content_blocks: editingPage.content_blocks as any,
        seo_metadata: editingPage.seo_metadata as any,
        is_published: editingPage.is_published,
        updated_at: new Date().toISOString(),
      }).eq("id", editingPage.id);

      if (error) throw error;
      await logAdminAction("update_page", "cms_pages", editingPage.id, { slug: editingPage.slug, blocks: editingPage.content_blocks.length });
      toast({ title: "Page Saved", description: editingPage.is_published ? "Changes are live on the website." : "Saved as draft." });
      fetchPages();
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Block Operations ────────────────────────────────────────
  const updatePage = useCallback((updater: (p: Page) => Page) => {
    setEditingPage(prev => prev ? updater(prev) : null);
  }, []);

  const addBlock = (type: BlockType) => {
    updatePage(p => ({
      ...p,
      content_blocks: [...p.content_blocks, { id: crypto.randomUUID(), type, content: getDefaultContent(type) }]
    }));
    setShowPalette(false);
  };

  const removeBlock = (id: string) => {
    if (!confirm("Remove this block?")) return;
    updatePage(p => ({ ...p, content_blocks: p.content_blocks.filter(b => b.id !== id) }));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    updatePage(p => {
      const blocks = [...p.content_blocks];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= blocks.length) return p;
      [blocks[index], blocks[swapIdx]] = [blocks[swapIdx], blocks[index]];
      return { ...p, content_blocks: blocks };
    });
  };

  const updateBlockContent = (blockId: string, field: string, value: any) => {
    updatePage(p => ({
      ...p,
      content_blocks: p.content_blocks.map(b =>
        b.id === blockId ? { ...b, content: { ...b.content, [field]: value } } : b
      ),
    }));
  };

  const updateBlockArrayItem = (blockId: string, field: string, index: number, key: string, value: any) => {
    updatePage(p => ({
      ...p,
      content_blocks: p.content_blocks.map(b => {
        if (b.id !== blockId) return b;
        const arr = [...(b.content[field] || [])];
        arr[index] = { ...arr[index], [key]: value };
        return { ...b, content: { ...b.content, [field]: arr } };
      }),
    }));
  };

  const addArrayItem = (blockId: string, field: string, template: any) => {
    updatePage(p => ({
      ...p,
      content_blocks: p.content_blocks.map(b =>
        b.id === blockId ? { ...b, content: { ...b.content, [field]: [...(b.content[field] || []), template] } } : b
      ),
    }));
  };

  const removeArrayItem = (blockId: string, field: string, index: number) => {
    updatePage(p => ({
      ...p,
      content_blocks: p.content_blocks.map(b => {
        if (b.id !== blockId) return b;
        const arr = [...(b.content[field] || [])];
        arr.splice(index, 1);
        return { ...b, content: { ...b.content, [field]: arr } };
      }),
    }));
  };

  // ─── EDITING VIEW ────────────────────────────────────────────
  if (editingPage) {
    const blockPalette = BLOCK_PALETTE.find(bp => false); // just for type

    return (
      <div className="space-y-6 max-w-[1400px]">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditingPage(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold font-poppins text-foreground flex items-center gap-2">
                /{editingPage.slug}
                {editingPage.is_published ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-full">Published</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded-full">Draft</span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground font-sans">{editingPage.content_blocks.length} block{editingPage.content_blocks.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2 border-r pr-3">
              <label className="text-xs font-semibold text-muted-foreground">Publish</label>
              <Switch checked={editingPage.is_published} onCheckedChange={v => updatePage(p => ({ ...p, is_published: v }))} />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="font-semibold text-xs">
              {showPreview ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide Preview</> : <><Eye className="h-3.5 w-3.5 mr-1.5" /> Preview</>}
            </Button>
            <Button size="sm" onClick={handleSavePage} disabled={saving} className="font-bold text-xs">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Saving..." : "Save Page"}
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview ? "xl:grid-cols-2" : "lg:grid-cols-3"}`}>
          {/* Block Editor Column */}
          <div className={`${showPreview ? "" : "lg:col-span-2"} space-y-4`}>
            {/* Add Block Button */}
            <div className="relative">
              <Button variant="outline" className="w-full border-dashed border-2 h-12 font-semibold text-sm" onClick={() => setShowPalette(!showPalette)}>
                <Plus className="h-4 w-4 mr-2" /> Add Content Block
              </Button>

              {/* Block Palette Dropdown */}
              {showPalette && (
                <div className="absolute z-20 top-14 left-0 right-0 bg-card border rounded-3xl shadow-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {BLOCK_PALETTE.map(bp => {
                    const Icon = bp.icon;
                    return (
                      <button
                        key={bp.type}
                        onClick={() => addBlock(bp.type)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all text-center group"
                      >
                        <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs font-bold text-foreground">{bp.label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{bp.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Block List */}
            {editingPage.content_blocks.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-muted/10 rounded-3xl border-dashed border-2">
                <Layout className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-semibold text-sm">No content blocks yet</p>
                <p className="text-xs mt-1">Click "Add Content Block" above to start building your page.</p>
              </div>
            )}

            {editingPage.content_blocks.map((block, index) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={index}
                totalBlocks={editingPage.content_blocks.length}
                onMove={moveBlock}
                onRemove={removeBlock}
                onUpdateContent={updateBlockContent}
                onUpdateArrayItem={updateBlockArrayItem}
                onAddArrayItem={addArrayItem}
                onRemoveArrayItem={removeArrayItem}
              />
            ))}
          </div>

          {/* Sidebar / Preview */}
          {showPreview ? (
            <div className="space-y-4">
              <div className="bg-card border rounded-3xl overflow-hidden shadow-sm sticky top-4">
                <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Preview</span>
                </div>
                <div className="p-4 max-h-[75vh] overflow-y-auto">
                  <LivePreview blocks={editingPage.content_blocks} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Page Properties */}
              <div className="bg-card border rounded-3xl p-5 space-y-4 shadow-sm">
                <h3 className="font-bold font-poppins text-sm border-b pb-3">Page Properties</h3>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Page Title</label>
                  <Input value={editingPage.title} onChange={e => updatePage(p => ({ ...p, title: e.target.value }))} className="font-semibold h-11 text-base" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
                  <Textarea value={editingPage.description || ""} onChange={e => updatePage(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
              </div>

              {/* SEO Metadata */}
              <div className="bg-card border rounded-3xl p-5 space-y-4 shadow-sm">
                <h3 className="font-bold font-poppins text-sm border-b pb-3">SEO Settings</h3>
                <p className="text-[10px] text-muted-foreground">Override defaults for search engines.</p>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Meta Title</label>
                  <Input
                    value={editingPage.seo_metadata?.meta_title || ""}
                    onChange={e => updatePage(p => ({ ...p, seo_metadata: { ...p.seo_metadata, meta_title: e.target.value } }))}
                    placeholder="Page title for search results"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Meta Description</label>
                  <Textarea
                    value={editingPage.seo_metadata?.meta_description || ""}
                    onChange={e => updatePage(p => ({ ...p, seo_metadata: { ...p.seo_metadata, meta_description: e.target.value } }))}
                    placeholder="Short description for search results"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PAGES LIST VIEW ─────────────────────────────────────────
  const filteredPages = pages.filter(p =>
    p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Page Builder</h1>
          <p className="text-xs text-muted-foreground font-sans">Create and manage dynamic content pages with the visual block editor.</p>
        </div>
        <Button size="sm" onClick={handleCreateNew} className="font-bold shrink-0 text-xs h-8 rounded-lg">
          <Plus className="h-3.5 w-3.5 mr-1" /> Create Page
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search pages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 bg-card h-8 text-xs rounded-lg" />
      </div>

      {/* Pages Table */}
      <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left font-sans">
          <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4 font-poppins">Slug</th>
              <th className="px-6 py-4 font-poppins">Title</th>
              <th className="px-6 py-4 font-poppins">Blocks</th>
              <th className="px-6 py-4 font-poppins">Status</th>
              <th className="px-6 py-4 font-poppins hidden md:table-cell">Last Updated</th>
              <th className="px-6 py-4 text-right font-poppins">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center">
                <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : filteredPages.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-semibold">
                {searchQuery ? "No pages match your search." : "No pages created yet. Click 'Create Page' to get started."}
              </td></tr>
            ) : (
              filteredPages.map(page => (
                <tr key={page.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-mono text-primary font-semibold text-xs">/{page.slug}</td>
                  <td className="px-6 py-4 font-semibold text-foreground">{page.title}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold bg-muted/50 border px-2 py-0.5 rounded-full">{page.content_blocks?.length || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${page.is_published ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                      {page.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground font-semibold hidden md:table-cell">
                    {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={() => setEditingPage(page)}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeletePage(page)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Block Editor Component ────────────────────────────────────
function BlockEditor({
  block, index, totalBlocks, onMove, onRemove,
  onUpdateContent, onUpdateArrayItem, onAddArrayItem, onRemoveArrayItem
}: {
  block: ContentBlock;
  index: number;
  totalBlocks: number;
  onMove: (i: number, d: "up" | "down") => void;
  onRemove: (id: string) => void;
  onUpdateContent: (id: string, field: string, value: any) => void;
  onUpdateArrayItem: (id: string, field: string, idx: number, key: string, val: any) => void;
  onAddArrayItem: (id: string, field: string, template: any) => void;
  onRemoveArrayItem: (id: string, field: string, idx: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = BLOCK_PALETTE.find(bp => bp.type === block.type);
  const Icon = meta?.icon || Layout;

  return (
    <div className="border rounded-3xl bg-card shadow-sm overflow-hidden group">
      {/* Block Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b">
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-bold text-xs uppercase tracking-wider text-foreground">{meta?.label || block.type}</span>
          <span className="text-[10px] text-muted-foreground font-semibold">#{index + 1}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(index, "up")} disabled={index === 0}>
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(index, "down")} disabled={index === totalBlocks - 1}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onRemove(block.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Block Body */}
      {!collapsed && (
        <div className="p-5 space-y-4">
          {block.type === "hero" && (
            <HeroEditor block={block} onUpdate={onUpdateContent} />
          )}
          {block.type === "text" && (
            <TextEditor block={block} onUpdate={onUpdateContent} />
          )}
          {block.type === "features" && (
            <ArrayBlockEditor
              block={block}
              field="items"
              template={{ icon: "Shield", title: "", description: "" }}
              fields={[
                { key: "icon", label: "Icon Name", placeholder: "e.g. Shield, Lock, Zap" },
                { key: "title", label: "Title", placeholder: "Feature title" },
                { key: "description", label: "Description", placeholder: "Short description", multiline: true },
              ]}
              onUpdateContent={onUpdateContent}
              onUpdateArrayItem={onUpdateArrayItem}
              onAddArrayItem={onAddArrayItem}
              onRemoveArrayItem={onRemoveArrayItem}
            />
          )}
          {block.type === "cta" && (
            <CtaEditor block={block} onUpdate={onUpdateContent} />
          )}
          {block.type === "stats" && (
            <ArrayBlockEditor
              block={block}
              field="items"
              template={{ value: "", label: "" }}
              fields={[
                { key: "value", label: "Value", placeholder: "e.g. 50K+" },
                { key: "label", label: "Label", placeholder: "e.g. Active Users" },
              ]}
              onUpdateContent={onUpdateContent}
              onUpdateArrayItem={onUpdateArrayItem}
              onAddArrayItem={onAddArrayItem}
              onRemoveArrayItem={onRemoveArrayItem}
            />
          )}
          {block.type === "gallery" && (
            <ArrayBlockEditor
              block={block}
              field="images"
              template={{ url: "", caption: "" }}
              fields={[
                { key: "url", label: "Image URL", placeholder: "https://..." },
                { key: "caption", label: "Caption", placeholder: "Image caption" },
              ]}
              onUpdateContent={onUpdateContent}
              onUpdateArrayItem={onUpdateArrayItem}
              onAddArrayItem={onAddArrayItem}
              onRemoveArrayItem={onRemoveArrayItem}
            />
          )}
          {block.type === "faq" && (
            <ArrayBlockEditor
              block={block}
              field="items"
              template={{ question: "", answer: "" }}
              fields={[
                { key: "question", label: "Question", placeholder: "Common question..." },
                { key: "answer", label: "Answer", placeholder: "Answer text...", multiline: true },
              ]}
              onUpdateContent={onUpdateContent}
              onUpdateArrayItem={onUpdateArrayItem}
              onAddArrayItem={onAddArrayItem}
              onRemoveArrayItem={onRemoveArrayItem}
            />
          )}
          {block.type === "testimonials" && (
            <ArrayBlockEditor
              block={block}
              field="items"
              template={{ name: "", role: "", quote: "", rating: 5 }}
              fields={[
                { key: "name", label: "Name", placeholder: "Customer name" },
                { key: "role", label: "Role / Location", placeholder: "CEO, New York" },
                { key: "quote", label: "Testimonial", placeholder: "What they said...", multiline: true },
                { key: "rating", label: "Rating (1-5)", placeholder: "5", type: "number" },
              ]}
              onUpdateContent={onUpdateContent}
              onUpdateArrayItem={onUpdateArrayItem}
              onAddArrayItem={onAddArrayItem}
              onRemoveArrayItem={onRemoveArrayItem}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Individual Block Editors ──────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-muted-foreground block mb-1">{children}</label>;
}

function HeroEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (id: string, f: string, v: any) => void }) {
  return (
    <>
      <div><FieldLabel>Headline</FieldLabel><Input value={block.content.headline || ""} onChange={e => onUpdate(block.id, "headline", e.target.value)} placeholder="Main headline text" /></div>
      <div><FieldLabel>Subheadline</FieldLabel><Textarea value={block.content.subheadline || ""} onChange={e => onUpdate(block.id, "subheadline", e.target.value)} placeholder="Supporting text" rows={2} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><FieldLabel>Button Text</FieldLabel><Input value={block.content.cta_text || ""} onChange={e => onUpdate(block.id, "cta_text", e.target.value)} placeholder="Get Started" /></div>
        <div><FieldLabel>Button Link</FieldLabel><Input value={block.content.cta_link || ""} onChange={e => onUpdate(block.id, "cta_link", e.target.value)} placeholder="/signup" /></div>
      </div>
      <div><FieldLabel>Background Image URL</FieldLabel><Input value={block.content.bg_image || ""} onChange={e => onUpdate(block.id, "bg_image", e.target.value)} placeholder="https://..." /></div>
    </>
  );
}

function TextEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (id: string, f: string, v: any) => void }) {
  return (
    <>
      <div><FieldLabel>Section Title</FieldLabel><Input value={block.content.title || ""} onChange={e => onUpdate(block.id, "title", e.target.value)} placeholder="Section heading" /></div>
      <div><FieldLabel>Body Content</FieldLabel><Textarea value={block.content.body || ""} onChange={e => onUpdate(block.id, "body", e.target.value)} placeholder="Write your content here..." rows={6} className="font-sans" /></div>
      <div>
        <FieldLabel>Text Alignment</FieldLabel>
        <div className="flex gap-2 mt-1">
          {["left", "center", "right"].map(a => (
            <button key={a} onClick={() => onUpdate(block.id, "alignment", a)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors capitalize ${block.content.alignment === a ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function CtaEditor({ block, onUpdate }: { block: ContentBlock; onUpdate: (id: string, f: string, v: any) => void }) {
  return (
    <>
      <div><FieldLabel>Headline</FieldLabel><Input value={block.content.headline || ""} onChange={e => onUpdate(block.id, "headline", e.target.value)} placeholder="Call to action headline" /></div>
      <div><FieldLabel>Description</FieldLabel><Textarea value={block.content.description || ""} onChange={e => onUpdate(block.id, "description", e.target.value)} placeholder="Supporting description" rows={2} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><FieldLabel>Button Text</FieldLabel><Input value={block.content.button_text || ""} onChange={e => onUpdate(block.id, "button_text", e.target.value)} placeholder="Learn More" /></div>
        <div><FieldLabel>Button Link</FieldLabel><Input value={block.content.button_link || ""} onChange={e => onUpdate(block.id, "button_link", e.target.value)} placeholder="/contact" /></div>
      </div>
      <div>
        <FieldLabel>Background Color</FieldLabel>
        <div className="flex items-center gap-3">
          <input type="color" value={block.content.bg_color || "#1e3a5f"} onChange={e => onUpdate(block.id, "bg_color", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
          <Input value={block.content.bg_color || "#1e3a5f"} onChange={e => onUpdate(block.id, "bg_color", e.target.value)} className="font-mono text-xs max-w-[120px]" />
        </div>
      </div>
    </>
  );
}

// ─── Generic Array Block Editor ────────────────────────────────
function ArrayBlockEditor({
  block, field, template, fields,
  onUpdateContent, onUpdateArrayItem, onAddArrayItem, onRemoveArrayItem,
}: {
  block: ContentBlock;
  field: string;
  template: any;
  fields: { key: string; label: string; placeholder: string; multiline?: boolean; type?: string }[];
  onUpdateContent: (id: string, f: string, v: any) => void;
  onUpdateArrayItem: (id: string, f: string, i: number, k: string, v: any) => void;
  onAddArrayItem: (id: string, f: string, t: any) => void;
  onRemoveArrayItem: (id: string, f: string, i: number) => void;
}) {
  const items = block.content[field] || [];

  return (
    <>
      <div><FieldLabel>Section Title</FieldLabel><Input value={block.content.title || ""} onChange={e => onUpdateContent(block.id, "title", e.target.value)} placeholder="Section heading" /></div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Items ({items.length})</span>
          <Button size="sm" variant="outline" className="h-7 text-xs font-semibold" onClick={() => onAddArrayItem(block.id, field, { ...template })}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>

        {items.map((item: any, idx: number) => (
          <div key={idx} className="border rounded-lg p-3 bg-muted/10 space-y-2 relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => onRemoveArrayItem(block.id, field, idx)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">Item #{idx + 1}</span>
            <div className="grid gap-2" style={{ gridTemplateColumns: fields.length <= 2 ? "1fr 1fr" : "1fr" }}>
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold text-muted-foreground">{f.label}</label>
                  {f.multiline ? (
                    <Textarea value={item[f.key] || ""} onChange={e => onUpdateArrayItem(block.id, field, idx, f.key, e.target.value)} placeholder={f.placeholder} rows={2} className="text-xs mt-0.5" />
                  ) : (
                    <Input value={item[f.key] || ""} type={f.type || "text"} onChange={e => onUpdateArrayItem(block.id, field, idx, f.key, f.type === "number" ? Number(e.target.value) : e.target.value)} placeholder={f.placeholder} className="text-xs h-8 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Live Preview ──────────────────────────────────────────────
function LivePreview({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-xs font-semibold">Add blocks to see a live preview</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {blocks.map(block => (
        <PreviewBlock key={block.id} block={block} />
      ))}
    </div>
  );
}

function PreviewBlock({ block }: { block: ContentBlock }) {
  const c = block.content;

  switch (block.type) {
    case "hero":
      return (
        <div className="rounded-lg overflow-hidden relative" style={{ background: c.bg_image ? `url(${c.bg_image}) center/cover` : "linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%)" }}>
          <div className="p-8 text-center text-foreground bg-black/40">
            <h2 className="text-xl font-bold font-poppins">{c.headline || "Headline"}</h2>
            <p className="text-sm mt-2 opacity-80">{c.subheadline || "Subheadline text"}</p>
            {c.cta_text && <button className="mt-4 bg-white text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold">{c.cta_text}</button>}
          </div>
        </div>
      );

    case "text":
      return (
        <div className="p-4 rounded-lg bg-muted/10 border" style={{ textAlign: c.alignment || "left" }}>
          {c.title && <h3 className="font-bold font-poppins text-sm mb-2">{c.title}</h3>}
          <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{c.body || "Body text content..."}</p>
        </div>
      );

    case "features":
      return (
        <div className="p-4 rounded-lg bg-muted/10 border">
          {c.title && <h3 className="font-bold font-poppins text-sm mb-3 text-center">{c.title}</h3>}
          <div className="grid grid-cols-2 gap-2">
            {(c.items || []).map((it: any, i: number) => (
              <div key={i} className="p-3 bg-background rounded-lg border text-center">
                <p className="text-xs font-bold">{it.title || "Feature"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{it.description || "Description"}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="rounded-lg p-6 text-center text-foreground" style={{ backgroundColor: c.bg_color || "#1e3a5f" }}>
          <h3 className="font-bold font-poppins text-sm">{c.headline || "CTA Headline"}</h3>
          <p className="text-xs mt-1 opacity-80">{c.description || "Description"}</p>
          {c.button_text && <button className="mt-3 bg-white text-gray-900 px-4 py-1.5 rounded-lg text-xs font-bold">{c.button_text}</button>}
        </div>
      );

    case "stats":
      return (
        <div className="p-4 rounded-lg bg-muted/10 border">
          {c.title && <h3 className="font-bold font-poppins text-sm mb-3 text-center">{c.title}</h3>}
          <div className="grid grid-cols-3 gap-2 text-center">
            {(c.items || []).map((it: any, i: number) => (
              <div key={i} className="p-3">
                <p className="text-lg font-bold text-primary">{it.value || "0"}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{it.label || "Label"}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "gallery":
      return (
        <div className="p-4 rounded-lg bg-muted/10 border">
          {c.title && <h3 className="font-bold font-poppins text-sm mb-3 text-center">{c.title}</h3>}
          <div className="grid grid-cols-2 gap-2">
            {(c.images || []).map((img: any, i: number) => (
              <div key={i} className="aspect-video rounded-lg bg-muted overflow-hidden">
                {img.url ? <img src={img.url} alt={img.caption} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">No image</div>}
              </div>
            ))}
          </div>
        </div>
      );

    case "faq":
      return (
        <div className="p-4 rounded-lg bg-muted/10 border space-y-2">
          {c.title && <h3 className="font-bold font-poppins text-sm mb-2">{c.title}</h3>}
          {(c.items || []).map((it: any, i: number) => (
            <div key={i} className="border rounded-lg p-3 bg-background">
              <p className="text-xs font-bold">{it.question || "Question?"}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{it.answer || "Answer..."}</p>
            </div>
          ))}
        </div>
      );

    case "testimonials":
      return (
        <div className="p-4 rounded-lg bg-muted/10 border">
          {c.title && <h3 className="font-bold font-poppins text-sm mb-3 text-center">{c.title}</h3>}
          <div className="space-y-2">
            {(c.items || []).map((it: any, i: number) => (
              <div key={i} className="border rounded-lg p-3 bg-background">
                <p className="text-xs italic text-muted-foreground">"{it.quote || "Testimonial quote..."}"</p>
                <p className="text-[10px] font-bold mt-2">{it.name || "Name"} <span className="text-muted-foreground font-normal">· {it.role || "Role"}</span></p>
                <div className="flex gap-0.5 mt-1">{Array.from({ length: it.rating || 5 }).map((_, s) => <span key={s} className="text-[10px] text-warning">★</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return <div className="p-4 rounded-lg bg-muted/10 border text-xs text-muted-foreground">Unknown block type: {block.type}</div>;
  }
}
