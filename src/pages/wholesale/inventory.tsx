import React from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, wholesaleItems } from "@/components/layout/AppSidebar";
import { Upload, Plus, Package, AlertCircle, Pencil, Trash2, Image as ImageIcon, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, API_BASE } from "@/lib/api";

// Local CSV item interface (unchanged for CSV section)
interface CsvItem { sku: string; name: string; stock: number; price: number; }

// Backend Product interface
interface Product { id: string; name: string; price: number; stock: number; image: string | null; description: string }

const Inventory: React.FC = () => {
  // Keep CSV section state UNCHANGED as requested
  const [csvItems, setCsvItems] = React.useState<CsvItem[]>([
    { sku: "SKU-1001", name: "Sunrise Tea 250g", stock: 120, price: 85 },
    { sku: "SKU-1002", name: "Refined Sugar 1kg", stock: 80, price: 44 },
    { sku: "SKU-1003", name: "Premium Rice 5kg", stock: 45, price: 320 },
    { sku: "SKU-1004", name: "Organic Honey 500g", stock: 25, price: 180 },
  ]);
  const [csvImportedOnce, setCsvImportedOnce] = React.useState(false);
  const [csvParsing, setCsvParsing] = React.useState(false);
  const { toast } = useToast();

  

  // Helper: resolve absolute vs relative URLs
  const resolveUrl = React.useCallback((u?: string | null) => {
    if (!u) return "";
    if (u.startsWith("http")) return u;
    // If backend already returns an absolute path like "/api/uploads/...", use it as-is
    if (u.startsWith("/")) return u;
    // Otherwise treat as relative path and prefix with API base
    return `${API_BASE}${u.startsWith('/') ? '' : '/'}${u}`;
  }, []);

  // Products from backend
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.products.list(),
  });

  // Single row import from CSV
  const singleImportMutation = useMutation({
    mutationFn: (item: { name: string; price: number; stock?: number }) =>
      api.products.create({ name: item.name, price: item.price, stock: item.stock ?? 0, image: null, description: '' }),
    onSuccess: async (_res, item) => {
      // remove imported row
      setCsvItems((prev) => prev.filter((r) => !(r.name === item.name && Number(r.price) === Number(item.price) && Number(r.stock ?? 0) === Number(item.stock ?? 0))));
      toast({ title: 'Imported', description: `${item.name}` });
      await qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: any) => toast({ title: 'Import failed', description: e?.message || 'error', variant: 'destructive' }),
  });
  const products: Product[] = data?.products || [];
  const [productQuery, setProductQuery] = React.useState("");
  const visibleProducts = React.useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      String(p.id).toLowerCase().includes(q) ||
      String(p.name).toLowerCase().includes(q)
    );
  }, [products, productQuery]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  // Create product form
  const [draft, setDraft] = React.useState<{ name: string; price: number; stock: number; image: string; description: string }>({
    name: "",
    price: 0,
    stock: 0,
    image: "",
    description: "",
  });
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const onImageFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const { url } = await api.upload.image(file);
      setDraft((d) => ({ ...d, image: url }));
      setImagePreview(resolveUrl(url));
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || 'error', variant: 'destructive' });
    }
  };

  const createMutation = useMutation({
    mutationFn: () => api.products.create({
      name: draft.name.trim(),
      price: Number(draft.price),
      stock: Number(draft.stock || 0),
      image: draft.image ? draft.image.trim() : null,
      description: draft.description.trim(),
    }),
    onSuccess: async () => {
      toast({ title: "Product added", description: `${draft.name} created successfully.` });
      setDraft({ name: "", price: 0, stock: 0, image: "", description: "" });
      await qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast({ title: "Failed to add", description: e?.message || "error", variant: "destructive" }),
  });

  // Edit state and mutation
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState<Partial<Product>>({});
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditDraft({ ...p });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({});
  };
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; body: Partial<Product> }) => api.products.update(payload.id, payload.body),
    onSuccess: async () => {
      toast({ title: "Product updated" });
      setEditingId(null);
      setEditDraft({});
      await qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast({ title: "Failed to update", description: e?.message || "error", variant: "destructive" }),
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: (id: string) => api.products.remove(id),
    onSuccess: async () => {
      toast({ title: "Product removed" });
      await qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast({ title: "Failed to remove", description: e?.message || "error", variant: "destructive" }),
  });

  // Bulk create from CSV
  const bulkMutation = useMutation({
    mutationFn: (payload: { products: Array<{ name: string; price: number; stock?: number }> }) =>
      api.products.bulkCreate(payload.products),
    onSuccess: async (res) => {
      toast({ title: "Imported to Products", description: `${res.created} item(s) created.` });
      setCsvItems([]);
      await qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => toast({ title: "Bulk import failed", description: e?.message || 'error', variant: 'destructive' }),
  });

  // CSV section logic (unchanged behavior)
  const onCsv = (file: File) => {
    setCsvParsing(true);
    setCsvItems([]);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed: CsvItem[] = (res.data as any[])
          .map((r) => {
            const name = String(r.name || r.Name || r.product || r.Product || "").trim();
            const price = Number(r.price ?? r.Price ?? 0);
            const stock = Number(r.stock ?? r.Stock ?? r.qty ?? r.Qty ?? 0);
            const sku = String(r.sku || r.SKU || r.id || r.ID || "").trim();
            return { sku, name, stock, price } as CsvItem;
          })
          .filter((r) => !!r.name);
        setCsvItems((prev) => [...prev, ...parsed]);
        if (parsed.length > 0) {
          setCsvImportedOnce(true);
          toast({ title: "CSV parsed", description: `${parsed.length} row(s) ready to import.` });
        } else {
          toast({ title: "No rows found", description: "Please check your CSV headers (name, price, stock optional).", variant: "destructive" });
        }
        setCsvParsing(false);
      },
      error: () => { setCsvParsing(false); toast({ title: "Import failed", description: "Please check your CSV format.", variant: "destructive" }); },
    });
  };

  const lowStockProducts = products.filter((p) => p.stock < 30);

  return (
    <>
      <SEO title="Inventory Management • Orderly" description="Upload CSV or add items manually to manage your wholesale inventory." />
      <AppLayout>
        <AppSidebar items={wholesaleItems} />
        <main className="w-full max-w-7xl mx-auto px-6 py-6 bg-slate-50 min-h-screen">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-sm text-slate-600">Manage your product inventory and stock levels.</p>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-sm font-medium text-amber-800">
                  {lowStockProducts.length} item(s) running low on stock (below 30 units)
                </span>
              </div>
            </div>
          )}

          {/* Action Cards */}
          <section className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
                  <Upload className="mr-2 h-5 w-5 text-emerald-600" />
                  Upload CSV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-600">Import multiple items at once. Required: name, price. Optional: stock, sku</p>
                <input
                  type="file"
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  onChange={(e) => e.target.files?.[0] && onCsv(e.target.files[0])}
                  disabled={csvParsing}
                  className="block w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                />
                {csvParsing && <p className="mt-3 text-sm text-slate-500">Parsing CSV…</p>}
                {csvImportedOnce && csvItems.length === 0 && (
                  <p className="mt-3 text-sm text-slate-500">No new products from CSV</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
                  <Plus className="mr-2 h-5 w-5 text-emerald-600" />
                  Add Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="pname" className="text-sm font-medium text-slate-700">Product Name *</Label>
                    <Input
                      id="pname"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-slate-700">Price (Rs) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                      className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium text-slate-700">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={draft.stock}
                      onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                      className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image" className="text-sm font-medium text-slate-700">Product Image</Label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => onImageFile(e.target.files?.[0] || null)}
                        className="block w-full rounded-lg border border-slate-200 p-2 text-sm"
                      />
                      { (imagePreview || draft.image) && (
                        <img src={imagePreview || resolveUrl(draft.image)} alt="preview" className="h-12 w-12 rounded object-cover border" />
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="desc" className="text-sm font-medium text-slate-700">Description</Label>
                    <Input
                      id="desc"
                      value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Short description"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!draft.name || isNaN(Number(draft.price)) || Number(draft.price) <= 0 || createMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? 'Adding...' : 'Add Product'}
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* Products Table (Backend) */}
          <section>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
                    <Package className="mr-2 h-5 w-5 text-emerald-600" />
                    Products {isLoading ? '' : `(${visibleProducts.length} / ${products.length})`}
                  </CardTitle>
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by Product ID or Name"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 bg-white/60">
                        <TableHead className="font-semibold text-slate-700">Product Name</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Stock</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Price</TableHead>
                        <TableHead className="font-semibold text-slate-700">Image</TableHead>
                        <TableHead className="font-semibold text-slate-700">Description</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading...</TableCell>
                        </TableRow>
                      ) : (
                        visibleProducts.map((p) => (
                          <TableRow key={p.id} className="border-slate-100 hover:bg-white">
                            <TableCell className="text-slate-800">
                              {editingId === p.id ? (
                                <Input value={editDraft.name as string} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                              ) : (
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{p.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">ID: {p.id}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${p.stock < 30 ? 'text-amber-600' : 'text-slate-800'}` }>
                              {editingId === p.id ? (
                                <Input type="number" value={Number(editDraft.stock ?? p.stock)} onChange={(e) => setEditDraft({ ...editDraft, stock: Number(e.target.value) })} />
                              ) : (
                                <span>
                                  {p.stock}
                                  {p.stock < 30 && <span className="ml-1 text-xs text-amber-500">Low</span>}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-slate-800">
                              {editingId === p.id ? (
                                <Input type="number" step="0.01" value={Number(editDraft.price ?? p.price)} onChange={(e) => setEditDraft({ ...editDraft, price: Number(e.target.value) })} />
                              ) : (
                                <span className="text-slate-900">Rs{p.price.toFixed(2)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-700 min-w-40">
                              {editingId === p.id ? (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" className="flex items-center gap-1" asChild>
                                    <label className="cursor-pointer">
                                      <ImageIcon className="w-4 h-4" />
                                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        try {
                                          const { url } = await api.upload.image(f);
                                          setEditDraft({ ...editDraft, image: url });
                                          toast({ title: 'Image uploaded' });
                                        } catch (err: any) {
                                          toast({ title: 'Upload failed', description: err?.message || 'error', variant: 'destructive' });
                                        }
                                      }} />
                                      Upload
                                    </label>
                                  </Button>
                                  <span className="text-xs text-slate-500 truncate max-w-40">{(editDraft.image as string) ?? p.image ?? ''}</span>
                                </div>
                              ) : (
                                p.image ? <a href={resolveUrl(p.image)} target="_blank" className="text-emerald-600 hover:underline">Image</a> : <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-700 min-w-60">
                              {editingId === p.id ? (
                                <Input value={(editDraft.description as string) ?? p.description ?? ''} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} />
                              ) : (
                                <span className="truncate inline-block max-w-60" title={p.description}>{p.description || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editingId === p.id ? (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: p.id, body: {
                                    name: editDraft.name as string,
                                    price: editDraft.price as number,
                                    stock: editDraft.stock as number,
                                    image: (editDraft.image as string) ?? null,
                                    description: (editDraft.description as string) ?? '',
                                  } })}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setSelectedProduct(p)} className="flex items-center gap-1">
                                    View
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="flex items-center gap-1">
                                    <Pencil className="w-4 h-4" /> Edit
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => removeMutation.mutate(p.id)} className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1">
                                    <Trash2 className="w-4 h-4" /> Remove
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CSV Imported Items Preview (unchanged data) */}
          {csvItems.length > 0 && (
            <section className="mt-8">
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-800">CSV Imported Items (Local Preview)</CardTitle>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        // Map CSV rows to product shape: name, price, stock
                        const payload = csvItems
                          .map((r) => ({
                            name: r.name,
                            price: Number(r.price) || 0,
                            stock: Number(r.stock) || 0,
                          }))
                          .filter((p) => p.name && p.price > 0);
                        if (!payload.length) {
                          toast({ title: 'Nothing to import', description: 'Ensure rows have valid name and price.', variant: 'destructive' });
                          return;
                        }
                        bulkMutation.mutate({ products: payload });
                      }}
                      disabled={bulkMutation.isPending}
                    >
                      {bulkMutation.isPending ? 'Importing…' : 'Import to Products'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-4 pb-3 pt-2 text-sm text-slate-600">See below the products you want to import.</div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200">
                          <TableHead className="font-semibold text-slate-700">SKU</TableHead>
                          <TableHead className="font-semibold text-slate-700">Product Name</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Stock</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Price</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvItems.map((item) => (
                          <TableRow key={`${item.sku}-${item.name}`} className="border-slate-100">
                            <TableCell className="font-medium text-slate-800">{item.sku}</TableCell>
                            <TableCell className="text-slate-700">{item.name}</TableCell>
                            <TableCell className="text-right text-slate-800">{item.stock}</TableCell>
                            <TableCell className="text-right text-slate-800">Rs{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => singleImportMutation.mutate({ name: item.name, price: Number(item.price), stock: Number(item.stock) })}
                                disabled={singleImportMutation.isPending}
                              >
                                {singleImportMutation.isPending ? 'Importing…' : 'Import'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
          {/* Product Detail Dialog */}
          <Dialog open={!!selectedProduct} onOpenChange={(o) => { if (!o) setSelectedProduct(null); }}>
            <DialogContent className="sm:max-w-xl">
              {selectedProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="aspect-square bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center">
                    {selectedProduct.image ? (
                      <img
                        src={resolveUrl(selectedProduct.image)}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-product.png'; }}
                      />
                    ) : (
                      <Package className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">{selectedProduct.name}</DialogTitle>
                      <DialogDescription className="text-slate-600">Product details</DialogDescription>
                    </DialogHeader>
                    <div className="mt-3 space-y-2">
                      <div className="text-xl font-semibold text-slate-900">Rs{Number(selectedProduct.price).toFixed(2)}</div>
                      <div className="text-xs text-slate-500">Stock: {selectedProduct.stock}</div>
                      {selectedProduct.description && (
                        <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{selectedProduct.description}</p>
                      )}
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Product ID</span>
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{String(selectedProduct.id || '').slice(0,8)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </AppLayout>
    </>
  );
};

export default Inventory;