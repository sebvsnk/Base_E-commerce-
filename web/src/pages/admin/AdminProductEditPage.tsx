import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, updateProduct, uploadImage } from "../../services/products";
import { getErrorMessage } from "../../utils/error";
import AdminNav from "./AdminNav";

export default function AdminProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const formatPrice = (value: string | number) => {
    const numericValue = String(value).replace(/\D/g, "");
    if (!numericValue) return "";
    return new Intl.NumberFormat("es-CL").format(Number(numericValue));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      const newImages: string[] = [];
      for(let i=0; i<files.length; i++) {
          const { url } = await uploadImage(files[i]);
          newImages.push(url);
      }
      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error(error);
      setError("Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (id) {
        getProduct(id).then(p => {
            setName(p.name);
            setDescription(p.description);
            // If images array exists and has items, use it. wrapper for backward compatibility with p.image
            let imgs = p.images || [];
            if (imgs.length === 0 && p.image) {
                imgs = [p.image];
            }
            setImages(imgs);
            setPrice(formatPrice(p.price));
            setStock(String(p.stock));
            setSku(p.sku || "");
            setBrand(p.brand || "");
            setTags(p.tags || []);
        })
        .catch(e => setError(getErrorMessage(e) || "Error cargando producto"))
        .finally(() => setFetching(false));
    } else {
        setError("No ID provided");
        setFetching(false);
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);

    const numericPrice = Number(price.replace(/\./g, ""));
    const numericStock = Number(stock);

    if (!name.trim()) return setError("Nombre requerido");
    if (!numericPrice || numericPrice <= 0) return setError("Precio debe ser mayor a 0");
    if (numericStock < 0) return setError("Stock no puede ser negativo");
    
    if (images.length === 0) return setError("Debe tener al menos una imagen");
    const image = images[0];

    try {
      setLoading(true);
      await updateProduct(id, {
        name: name.trim(),
        description: description.trim(),
        image,
        images,
        price: numericPrice,
        stock: numericStock,
        brand: brand.trim() || null,
        sku: sku.trim() || null,
        tags
      });
      navigate("/admin/products");
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error actualizando producto");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div className="container">Cargando...</div>;

  return (
    <div className="container">
      <h1>Editar Producto</h1>
      <AdminNav />

      <div style={{ maxWidth: "600px", margin: "20px auto" }}>
        {error && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "8px", marginBottom: "1rem" }}>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
            
            {/* Basic Info */}
            <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="input"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium">Descripción</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="input"
                    rows={3}
                />
            </div>

             {/* Pricing & Stock */}
            <div className="grid-2">
                 <div>
                    <label className="block text-sm font-medium">Precio</label>
                    <input 
                        type="text" 
                        value={price} 
                        onChange={(e) => setPrice(formatPrice(e.target.value))} 
                        className="input"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Stock</label>
                    <input 
                        type="number" 
                        value={stock} 
                        onChange={(e) => setStock(e.target.value)} 
                        className="input"
                        min="0"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">SKU (Opcional)</label>
                <input 
                    type="text" 
                    value={sku} 
                    onChange={(e) => setSku(e.target.value)} 
                    className="input"
                />
            </div>

            {/* Attributes */}
            <div>
                <label className="block text-sm font-medium">Marca (Opcional)</label>
                <input 
                    type="text" 
                    value={brand} 
                    onChange={(e) => setBrand(e.target.value)} 
                    className="input"
                />
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium mb-2">Clasificación</label>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={tags.includes('for-her')} onChange={() => toggleTag('for-her')} />
                        Para Ellas
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={tags.includes('for-him')} onChange={() => toggleTag('for-him')} />
                        Para Ellos
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="checkbox" checked={tags.includes('accessories')} onChange={() => toggleTag('accessories')} />
                        Accesorios
                    </label>
                </div>
            </div>

            {/* Media */}
            <div>
                <label className="block text-sm font-medium">Imágenes (La primera será la principal)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                        type="file"
                        id="file-upload"
                        style={{ display: 'none' }}
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                    />
                    <label 
                        htmlFor="file-upload" 
                        className="btn" 
                        style={{ cursor: uploading ? 'wait' : 'pointer', width: '100%', textAlign: 'center' }}
                    >
                        {uploading ? "Subiendo..." : "Subir Imágenes"}
                    </label>
                </div>
                
                {images.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                        {images.map((img, idx) => (
                            <div key={idx} style={{ position: "relative", border: idx === 0 ? "2px solid var(--primary)" : "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                                <img src={img} alt={`Img ${idx}`} style={{ width: "100%", height: "100px", objectFit: "cover" }} />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    style={{ 
                                        position: "absolute", top: "2px", right: "2px", 
                                        background: "rgba(255,0,0,0.8)", color: "white", 
                                        border: "none", borderRadius: "50%", 
                                        width: "20px", height: "20px", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "12px"
                                    }}
                                >
                                    ×
                                </button>
                                {idx === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "white", fontSize: "10px", textAlign: "center" }}>Principal</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
        </form>
      </div>

       <style>{`
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .block { display: block; margin-bottom: 5px; }
      `}</style>
    </div>
  );
}
