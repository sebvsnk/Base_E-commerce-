import { useParams } from "react-router-dom";
import ProductCatalog from "../components/ProductCatalog";

const TAG_LABELS: Record<string, string> = {
  "for-her": "Para Ellas",
  "for-him": "Para Ellos",
  "accessories": "Accesorios"
};

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const title = tag && TAG_LABELS[tag] ? TAG_LABELS[tag] : "Productos";

  return (
    <section className="container">
      <ProductCatalog 
        initialFilters={{ tag }} 
        title={title}
        showTitle={true}
      />
    </section>
  );
}


