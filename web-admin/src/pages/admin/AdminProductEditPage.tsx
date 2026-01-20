import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, updateProduct, uploadImage } from "../../services/products";
import { getErrorMessage } from "../../utils/error";
import AdminNav from "./AdminNav";
import '../admin/AdminProductCreatePage.css';

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

  if (fetching) return <div className="admin-form-page"><div className="admin-form-container"><p>Cargando...</p></div></div>;

  return (
    <div className="admin-form-page">
      <div className="admin-form-container">
        <h1 className="admin-form-title">Editar Producto</h1>

        {error && (
            <div className="admin-form-error">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form-card">
            
            {/* Basic Info */}
            <div className="admin-form-group">
                <label className="admin-form-label">Nombre</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="admin-form-input"
                    required
                />
            </div>

            <div className="admin-form-group">
                <label className="admin-form-label">Descripción</label>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="admin-form-textarea"
                    rows={3}
                />
            </div>

             {/* Pricing & Stock */}
            <div className="admin-form-grid-2">
                 <div className="admin-form-group">
                    <label className="admin-form-label">Precio</label>
                    <input 
                        type="text" 
                        value={price} 
                        onChange={(e) => setPrice(formatPrice(e.target.value))} 
                        className="admin-form-input"
                    />
                </div>
                <div className="admin-form-group">
                    <label className="admin-form-label">Stock</label>
                    <input 
                        type="number" 
                        value={stock} 
                        onChange={(e) => setStock(e.target.value)} 
                        className="admin-form-input"
                        min="0"
                    />
                </div>
            </div>

            <div className="admin-form-group">
                <label className="admin-form-label">SKU (Opcional)</label>
                <input 
                    type="text" 
                    value={sku} 
                    onChange={(e) => setSku(e.target.value)} 
                    className="admin-form-input"
                />
            </div>

            {/* Attributes */}
            <div className="admin-form-group">
                <label className="admin-form-label">Marca (Opcional)</label>
                <input 
                    type="text" 
                    value={brand} 
                    onChange={(e) => setBrand(e.target.value)} 
                    className="admin-form-input"
                />
            </div>

            {/* Tags */}
            <div className="admin-form-group">
                <label className="admin-form-label">Clasificación</label>
                <div className="admin-form-checkbox-group">
                    <label className="admin-form-checkbox-label">
                        <input type="checkbox" checked={tags.includes('for-her')} onChange={() => toggleTag('for-her')} />
                        Para Ellas
                    </label>
                    <label className="admin-form-checkbox-label">
                        <input type="checkbox" checked={tags.includes('for-him')} onChange={() => toggleTag('for-him')} />
                        Para Ellos
                    </label>
                    <label className="admin-form-checkbox-label">
                        <input type="checkbox" checked={tags.includes('accessories')} onChange={() => toggleTag('accessories')} />
                        Accesorios
                    </label>
                </div>
            </div>

            {/* Media */}
            <div className="admin-form-group">
                <label className="admin-form-label">Imágenes (La primera será la principal)</label>
                <div>
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
                        className={`admin-form-file-label ${uploading ? 'uploading' : ''}`}
                    >
                        {uploading ? "Subiendo..." : "Subir Imágenes"}
                    </label>
                </div>
                
                {images.length > 0 && (
                    <div className="admin-form-image-grid">
                        {images.map((img, idx) => (
                            <div key={idx} className={`admin-form-image-item ${idx === 0 ? 'primary' : ''}`}>
                                <img src={img} alt={`Img ${idx}`} className="admin-form-image" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="admin-form-image-remove"
                                >
                                    ×
                                </button>
                                {idx === 0 && <div className="admin-form-image-badge">Principal</div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button type="submit" className="admin-form-submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
        </form>
      </div>
    </div>
  );
}
