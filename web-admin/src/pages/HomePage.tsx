import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Banner from "../components/Banner";
import CategoryGrid from "../components/CategoryGrid";
import { listCategories, type Category } from "../services/categories";
import ProductCatalog from "../components/ProductCatalog";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? undefined;

  useEffect(() => {
    listCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <section>
      <Banner />

      <CategoryGrid 
        categories={categories} 
        onSelectCategory={(id) => setSelectedCategory(id)} 
      />

      {/* Main Catalog */}
      <div style={{ marginBottom: '60px', paddingBottom: '20px', borderBottom: '1px solid var(--border-overlay)' }}>
          <h1>Productos</h1>
          
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button
              className={`btn ${!selectedCategory ? "btn--primary" : ""}`}
              onClick={() => setSelectedCategory(undefined)}
            >
              Todos
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`btn ${selectedCategory === c.id ? "btn--primary" : ""}`}
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.name} ({c._count?.products ?? 0})
              </button>
            ))}
          </div>

          <ProductCatalog 
            initialFilters={{ categoryId: selectedCategory, q }} 
            showTitle={false} 
            showFilters={false}
            showSort={false}
          />
      </div>
    </section>
  );
}
