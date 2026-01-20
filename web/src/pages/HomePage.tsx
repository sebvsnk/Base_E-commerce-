import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Banner from "../components/Banner";
import CategoryGrid from "../components/CategoryGrid";
import { listCategories, type Category } from "../services/categories";
import ProductCatalog from "../components/ProductCatalog";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const q = searchParams.get("q") ?? undefined;
  const categoryIdParam = searchParams.get("category");

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(categoryIdParam || undefined);

  useEffect(() => {
    listCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (categoryIdParam) {
      setSelectedCategory(categoryIdParam);
    } else {
      setSelectedCategory(undefined);
    }
  }, [categoryIdParam]);

  const handleCategorySelect = (id: string | undefined) => {
    setSelectedCategory(id);
    if (id) {
        setSearchParams(prev => {
            prev.set("category", id);
            return prev;
        });
    } else {
        setSearchParams(prev => {
            prev.delete("category");
            return prev;
        });
    }
  };

  return (
    <section>
      <Banner />

      <CategoryGrid 
        categories={categories} 
        onSelectCategory={handleCategorySelect} 
      />

      {/* Main Catalog */}
      <div style={{ marginBottom: '60px', paddingBottom: '20px', borderBottom: '1px solid var(--border-overlay)' }}>
          <h1>Productos</h1>
          
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button
                key={c.id}
                className={`btn ${selectedCategory === c.id ? "btn--primary" : ""}`}
                onClick={() => handleCategorySelect(c.id)}
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
