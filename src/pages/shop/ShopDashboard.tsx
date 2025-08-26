import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar, shopItems, salespersonItems } from "@/components/layout/AppSidebar";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { ShoppingCart, User, ListFilter, SortAsc, SortDesc, Store, Package, TrendingUp, Star, Filter } from "lucide-react";
import { flyToCart } from "@/utils/flyToCart";
import { useQuery } from '@tanstack/react-query';
import { api, API_BASE } from '@/lib/api';
import { useTheme } from "next-themes";
import { Object as FabricObject } from "fabric";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function ShopDashboard() {
  const { user } = useAuth();
  // Helper to handle absolute vs relative URLs
  const resolveUrl = (u?: string | null) => {
    if (!u) return '';
    return u.startsWith('http') ? u : `${API_BASE}${u}`;
  };
  // Fallback image getter: prefer p.image, else first of p.images
  const getProductImage = (p: any): string | null => {
    if (p?.image) return p.image;
    if (Array.isArray(p?.images) && p.images.length > 0) return p.images[0];
    return null;
  };
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "stock">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [category, setCategory] = useState<string>("");
  const cartIconRef = useRef<HTMLDivElement | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Fetch distributors
  const { data: distData } = useQuery({
    queryKey: ['distributors'],
    queryFn: () => api.public.listDistributors(),
  });
  const distributors = distData?.distributors || [];

  // Fetch products
  const { data: prodData } = useQuery({
    queryKey: ['public-products'],
    queryFn: () => api.public.listProducts(),
  });
  const products = prodData?.products || [];

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const matchesName = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesDistributor = (p.distributorName || '').toLowerCase().includes(query.toLowerCase());
      // No category logic for now
      const matchesDistributorId = selectedDistributor ? p.ownerId === selectedDistributor : true;
      return matchesName && matchesDistributor && matchesDistributorId;
    });
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "price") cmp = a.price - b.price;
      else cmp = a.stock - b.stock;
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [products, query, selectedDistributor, sortBy, sortOrder]);

  // Add to cart
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  const addToCart = async (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setAddingToCart(id);
    const qty = stockInput[id] || 1;
    try {
      // Client-side stock guard using current product list
      const product = products.find(pp => pp.id === id);
      if (product && Number(product.stock || 0) <= 0) {
        toast.error("Sorry, this product is out of stock.");
        return;
      }
      await api.orders.addToCart([{ productId: id, qty }]);
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  // Distributor detail view
  const distributorDetail = selectedDistributor ? distributors.find(d => d.id === selectedDistributor) : null;

  return (
    <>
      <SEO title="Shopkeeper Dashboard • Orderly" description="Browse and order products from trusted distributors." />
      <AppLayout>
        <AppSidebar 
          items={user?.role === 'salesperson' ? salespersonItems : shopItems} 
          cartInfo={
            <div ref={cartIconRef}>
              <span className="text-sm font-medium text-emerald-700">
                Rs{Object.entries(cart).reduce((sum, [id, qty]) => {
                  const p = products.find(pp => pp.id === id);
                  return sum + (p ? p.price * qty : 0);
                }, 0).toFixed(2)}
              </span>
            </div>
          }
        />
        <main className="w-full max-w-7xl mx-auto px-6 py-6 bg-slate-50 min-h-screen">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Products</h1>
            <p className="text-sm text-slate-600">Browse and order from our trusted distributors.</p>
          </div>

          {/* Sticky Search + Sort */}
          <div className="sticky top-0 z-10 -mx-6 mb-6 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="px-6 py-3 flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex-1">
                <Input 
                  placeholder="Search products by name or distributor..." 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  className="h-10 border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200" 
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as "price" | "stock")}
                  className="h-9 px-3 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="price">Sort by price</option>
                  <option value="stock">Sort by stock</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
                  className="h-9 px-3 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all duration-200"
                >
                  {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Simple Distributor Filter */}
          {selectedDistributor && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="font-medium text-slate-800">Showing products from {distributorDetail?.organizationName || distributorDetail?.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedDistributor(null)}
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          )}

          {/* Distributor Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedDistributor(null)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  !selectedDistributor 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' 
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                All Distributors
              </button>
              {distributors.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDistributor(d.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                    selectedDistributor === d.id 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  {d.organizationName || d.email}
                </button>
              ))}
            </div>
          </div>



          {/* Simple Products Grid */}
          <div className="text-sm text-slate-600 mb-4">
             <span className="font-medium text-slate-900">{filteredProducts.length}</span> products {selectedDistributor && (
               <span>from <span className="font-medium text-slate-900">{distributorDetail?.organizationName || distributorDetail?.email}</span></span>
             )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-slate-500">No products found</div>
              </div>
            ) : filteredProducts.map((p) => (
              <Card 
                key={p.id} 
                className="group hover:shadow-md transition-shadow border border-slate-200 bg-white cursor-pointer"
                onClick={() => setSelectedProduct(p)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative overflow-hidden bg-white">
                    {getProductImage(p) ? (
                      <img 
                        src={resolveUrl(getProductImage(p))}
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Package className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    {typeof p.stock === 'number' && p.stock <= 10 && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded font-medium">
                          {p.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1 gap-3">
                      <span className="text-sm font-medium text-slate-900 line-clamp-2">{p.name}</span>
                      <span className="text-lg font-semibold text-slate-900">Rs{p.price}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">from {p.distributorName}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Stock: {p.stock}</span>
                      <Input
                        type="number"
                        min={1}
                        max={p.stock}
                        value={stockInput[p.id] || 1}
                        onChange={e => setStockInput(s => ({ ...s, [p.id]: Math.max(1, Math.min(Number(e.target.value), p.stock)) }))}
                        className="w-16 h-8 text-center mr-2 border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        disabled={addingToCart === p.id || p.stock <= 0}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button 
                        size="sm" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-200 disabled:opacity-60" 
                        onClick={e => { e.stopPropagation(); addToCart(p.id, e); }}
                        disabled={addingToCart === p.id || p.stock <= 0}
                      >
                        {addingToCart === p.id
                          ? 'Adding...'
                          : p.stock <= 0
                            ? 'Out of Stock'
                            : (cart[p.id] ? `In Cart (${cart[p.id]})` : 'Add to Cart')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Product Detail Dialog */}
          <Dialog open={!!selectedProduct} onOpenChange={(o) => { if (!o) setSelectedProduct(null); }}>
            <DialogContent className="sm:max-w-xl">
              {selectedProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="aspect-square bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                    {getProductImage(selectedProduct) ? (
                      <img
                        src={resolveUrl(getProductImage(selectedProduct))}
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
                      <DialogDescription className="text-slate-600">from {selectedProduct.distributorName}</DialogDescription>
                    </DialogHeader>
                    <div className="mt-3 space-y-2">
                      <div className="text-xl font-semibold text-slate-900">Rs{selectedProduct.price}</div>
                      <div className="text-xs text-slate-500">Stock: {selectedProduct.stock}</div>
                      {selectedProduct.description && (
                        <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{selectedProduct.description}</p>
                      )}
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Product ID</span>
                          <span className="font-mono text-slate-800">{String(selectedProduct.id || '').slice(0,8)}</span>
                        </div>
                        {selectedProduct.ownerId && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Distributor ID</span>
                            <span className="font-mono text-slate-800">{String(selectedProduct.ownerId).slice(0,8)}</span>
                          </div>
                        )}
                        {selectedProduct.sku && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">SKU</span>
                            <span className="text-slate-800">{selectedProduct.sku}</span>
                          </div>
                        )}
                        {selectedProduct.category && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Category</span>
                            <span className="text-slate-800">{selectedProduct.category}</span>
                          </div>
                        )}
                        {selectedProduct.unit && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Unit</span>
                            <span className="text-slate-800">{selectedProduct.unit}</span>
                          </div>
                        )}
                        {(selectedProduct.minOrderQty || selectedProduct.moq) && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Min order</span>
                            <span className="text-slate-800">{selectedProduct.minOrderQty || selectedProduct.moq}</span>
                          </div>
                        )}
                        {Array.isArray(selectedProduct.tags) && selectedProduct.tags.length > 0 && (
                          <div>
                            <span className="text-slate-500">Tags</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {selectedProduct.tags.map((t: any, i: number) => (
                                <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 border border-slate-200">{String(t)}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={selectedProduct.stock}
                        value={stockInput[selectedProduct.id] || 1}
                        onChange={e => setStockInput(s => ({ ...s, [selectedProduct.id]: Math.max(1, Math.min(Number(e.target.value), selectedProduct.stock)) }))}
                        className="w-20 h-9 text-center border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        disabled={addingToCart === selectedProduct.id || selectedProduct.stock <= 0}
                      />
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-200 disabled:opacity-60"
                        onClick={(e) => { addToCart(selectedProduct.id, e as any); }}
                        disabled={addingToCart === selectedProduct.id || selectedProduct.stock <= 0}
                      >
                        {addingToCart === selectedProduct.id ? 'Adding...' : (selectedProduct.stock <= 0 ? 'Out of Stock' : 'Add to Cart')}
                      </Button>
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
}
