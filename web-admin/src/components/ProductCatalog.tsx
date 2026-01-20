import { useEffect, useState } from "react";
import { useProducts } from "../features/products/use-products";
import ProductCard from "../components/ProductCard";
import { listBrands, type ProductFilters } from "../services/products";

const SORT_OPTIONS = [
  { label: "Más vendidos", value: "best-selling" },
  { label: "Alfabéticamente, A-Z", value: "alpha-asc" },
  { label: "Alfabéticamente, Z-A", value: "alpha-desc" },
  { label: "Precio, menor a mayor", value: "price-asc" },
  { label: "Precio, mayor a menor", value: "price-desc" },
  { label: "Fecha: antiguo(a) a reciente", value: "date-asc" },
  { label: "Fecha: reciente a antiguo(a)", value: "date-desc" },
];

interface ProductCatalogProps {
  initialFilters?: ProductFilters;
  title?: string; // Optional title override
  showTitle?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
}

export default function ProductCatalog({ 
  initialFilters = {}, 
  title, 
  showTitle = true, 
  showFilters = true, 
  showSort = true 
}: ProductCatalogProps) {
  const [filters, setFilters] = useState<ProductFilters>({ sort: 'best-selling', ...initialFilters });
  const [brands, setBrands] = useState<string[]>([]);
  
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const { products, loading, error } = useProducts(filters);

  // Update filters when initialFilters specific props change (like tag or categoryId)
  useEffect(() => {
    setFilters(prev => ({ 
      ...prev, 
      ...initialFilters,
      // Reset generic filters if the context changes significantly? 
      // For now we assume if initialFilters changes, we re-initialize base keys
      // but keep user selected sort?
      // Actually simpler to just reset if tag/category changes.
    }));
    // Also reload brands suitable for this context
    listBrands(initialFilters.categoryId, initialFilters.tag).then(setBrands).catch(console.error);
  }, [initialFilters.tag, initialFilters.categoryId]);

  const handleApplyPrice = () => {
    setFilters(prev => ({
      ...prev,
      minPrice: minPriceInput ? Number(minPriceInput) : undefined,
      maxPrice: maxPriceInput ? Number(maxPriceInput) : undefined,
    }));
  };

  return (
    <div className="product-catalog-container">
      {showTitle && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {title && <h1>{title}</h1>}
          
          {showSort && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <label style={{ fontSize: '0.9rem' }}>Ordenar por:</label>
              <select 
                className="input" 
                style={{ width: 'auto', padding: '8px' }}
                value={filters.sort || 'best-selling'}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* If no title, maybe put sort on top right anyway? */}
      {(!showTitle && showSort) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '0.9rem' }}>Ordenar por:</label>
            <select 
              className="input" 
              style={{ width: 'auto', padding: '8px' }}
              value={filters.sort || 'best-selling'}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="catalog-layout" style={{ display: 'grid', gridTemplateColumns: showFilters ? 'minmax(200px, 250px) 1fr' : '1fr', gap: 20 }}>
        {/* Sidebar Filters */}
        {showFilters && (
          <aside>
            <div className="card simple" style={{ marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Filtros</h3>
              
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Marca</label>
                <select 
                  className="input"
                  value={filters.brand || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value || undefined }))}
                >
                  <option value="">Todas</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Precio</label>
                <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="input" 
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="input"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                  />
                </div>
                <button className="btn btn--primary" style={{ width: '100%' }} onClick={handleApplyPrice}>Aplicar</button>
              </div>
            </div>
          </aside>
        )}

        {/* Product Grid */}
        <div style={{ minWidth: 0 }}>
          {loading && <p className="muted">Cargando productos...</p>}
          {error && <p className="muted">{error}</p>}
          
          {!loading && (!products || products.length === 0) && (
            <p>No se encontraron productos con estos filtros.</p>
          )}

          <div className="grid" style={{ marginTop: 0, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {products?.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Responsive adjustments can be done via CSS media queries if we add a class or style block */}
      <style>{`
        @media (max-width: 768px) {
          .catalog-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
