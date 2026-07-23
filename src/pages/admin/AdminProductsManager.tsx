import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Box, Save, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/audit";
import { Switch } from "@/components/ui/switch";
import { StaggerContainer, StaggerItem, FadeIn, SlideUp } from "@/components/public/Motion";
import { CardSkeleton } from "@/components/skeletons/DashboardSkeleton";

interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  features: string[];
  interest_rate: number | null;
  fee: number | null;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
}

export default function AdminProductsManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("cms-products-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_products" }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cms_products").select("*").order("display_order");
      if (error) throw error;
      setProducts(data as Product[]);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingProduct({
      id: "new",
      category: "checking",
      name: "New Product",
      description: "",
      features: [],
      interest_rate: null,
      fee: null,
      display_order: products.length,
      is_active: false,
      image_url: ""
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    
    try {
      const payload = {
        category: editingProduct.category,
        name: editingProduct.name,
        description: editingProduct.description,
        features: editingProduct.features,
        interest_rate: editingProduct.interest_rate,
        fee: editingProduct.fee,
        display_order: editingProduct.display_order,
        is_active: editingProduct.is_active,
        image_url: editingProduct.image_url,
        updated_at: new Date().toISOString()
      };

      if (editingProduct.id === "new") {
        const { error } = await supabase.from("cms_products").insert(payload);
        if (error) throw error;
        toast({ title: "Product Created", description: "The product has been added to the catalog." });
      } else {
        const { error } = await supabase.from("cms_products").update(payload).eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Product Saved", description: "The product details have been updated." });
        await logAdminAction("update_product", "cms_products", editingProduct.id, { name: editingProduct.name });
      }
      
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to completely delete "${product.name}"?`)) return;

    try {
      const { error } = await supabase.from("cms_products").delete().eq("id", product.id);
      if (error) throw error;
      toast({ title: "Product Deleted", description: "The product has been removed from the catalog." });
      await logAdminAction("delete_product", "cms_products", product.id, { name: product.name });
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    }
  };

  if (editingProduct) {
    return (
      <SlideUp className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-poppins text-foreground mb-1">{editingProduct.id === "new" ? "New Product" : "Edit Product"}</h1>
            <p className="text-sm text-muted-foreground font-sans">Manage product details and features.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
            <Button onClick={handleSaveProduct} className="font-bold"><Save className="h-4 w-4 mr-2" /> Save Product</Button>
          </div>
        </div>

        <div className="bg-card border rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="font-bold font-poppins text-lg">General Info</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Active</label>
              <Switch checked={editingProduct.is_active} onCheckedChange={(checked) => setEditingProduct({...editingProduct, is_active: checked})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold mb-1 block">Product Name</label><Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="h-11 text-base" /></div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Category</label>
              <select className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="loans">Loans</option>
                <option value="cards">Credit Cards</option>
                <option value="investments">Investments</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          <div><label className="text-xs font-semibold mb-1 block">Short Description</label><Textarea value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} className="h-20" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold mb-1 block">Interest Rate / APY (%)</label><Input type="number" step="0.01" value={editingProduct.interest_rate || ""} onChange={e => setEditingProduct({...editingProduct, interest_rate: parseFloat(e.target.value) || null})} className="h-11 text-base" /></div>
            <div><label className="text-xs font-semibold mb-1 block">Monthly/Annual Fee ($)</label><Input type="number" step="0.01" value={editingProduct.fee || ""} onChange={e => setEditingProduct({...editingProduct, fee: parseFloat(e.target.value) || null})} className="h-11 text-base" /></div>
          </div>

          <div><label className="text-xs font-semibold mb-1 block">Image/Icon URL</label><Input value={editingProduct.image_url || ""} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} className="font-mono h-11 text-base" placeholder="/assets/products/card.png" /></div>

          <div className="border-t pt-4">
            <label className="text-xs font-semibold mb-2 block">Key Features (One per line)</label>
            <Textarea 
              className="h-32" 
              value={editingProduct.features.join('\n')} 
              onChange={e => setEditingProduct({...editingProduct, features: e.target.value.split('\n').filter(f => f.trim())})} 
              placeholder="No monthly maintenance fee&#10;Unlimited domestic wires&#10;Dedicated account manager"
            />
          </div>
        </div>
      </SlideUp>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-1 sm:px-4 py-2 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-foreground mb-0.5">Banking Products</h1>
          <p className="text-xs text-muted-foreground font-sans">Manage checking, savings, loans, and credit card offerings.</p>
        </div>
        <Button size="sm" onClick={handleCreateNew} className="font-bold text-xs h-8 rounded-lg"><Plus className="h-3.5 w-3.5 mr-1" /> Add Product</Button>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-muted/10 text-muted-foreground">No products available in the catalog.</div>
        ) : (
          products.map(product => (
            <StaggerItem key={product.id}>
            <div className={`bg-card border rounded-3xl p-5 relative h-full ${!product.is_active && 'opacity-60 grayscale'}`}>
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setEditingProduct(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteProduct(product)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold font-poppins text-foreground leading-tight pr-10">{product.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{product.category}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
              
              <div className="flex gap-4 pt-4 border-t">
                {product.interest_rate !== null && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">APY / Rate</p>
                    <p className="font-mono font-bold text-success">{product.interest_rate}%</p>
                  </div>
                )}
                {product.fee !== null && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Fee</p>
                    <p className="font-mono font-bold text-foreground">${product.fee}</p>
                  </div>
                )}
              </div>
            </div>
            </StaggerItem>
          ))
        )}
      </StaggerContainer>
    </div>
  );
}
