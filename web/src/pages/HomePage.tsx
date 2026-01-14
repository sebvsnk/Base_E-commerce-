import { useEffect, useState } from "react";
import Banner from "../components/Banner";
import { listCategories, type Category } from "../services/categories";
import ProductCatalog from "../components/ProductCatalog";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  useEffect(() => {
    listCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <section>
      <Banner />

      {/* Main Catalog */}
      <div style={{ marginBottom: '60px', paddingBottom: '20px', borderBottom: '1px solid var(--border-overlay)' }}>
          <h1>Catálogo Completo</h1>
          
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
            initialFilters={{ categoryId: selectedCategory }} 
            showTitle={false} 
            showFilters={false}
            showSort={false}
          />
      </div>
    </section>
  );
}
