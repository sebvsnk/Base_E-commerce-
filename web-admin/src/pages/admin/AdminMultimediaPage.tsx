import { useState, useEffect, useRef } from "react";
import "./AdminMultimediaPage.css";

interface MediaAsset {
  id: string;
  type: string;
  section: string;
  title: string | null;
  url: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type MediaType = 'BANNER' | 'CATEGORY_IMAGE' | 'LOGO' | 'PROMOTION';

interface ImagePreview {
  file: File;
  url: string;
  type: MediaType;
  section: string;
  objectFit: 'cover' | 'contain';
  position: string;
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
  brightness: number;
  contrast: number;
}

const mediaTypeSections: Record<MediaType, { name: string; sections: string[] }> = {
  BANNER: {
    name: 'Banners Principales',
    sections: ['banner-1', 'banner-2', 'banner-3']
  },
  CATEGORY_IMAGE: {
    name: 'Imágenes de Categorías',
    sections: ['category-1', 'category-2', 'category-3', 'category-4', 'category-5', 'category-6']
  },
  LOGO: {
    name: 'Logos y Marca',
    sections: ['header-logo', 'footer-logo']
  },
  PROMOTION: {
    name: 'Promociones',
    sections: ['promo-1', 'promo-2', 'promo-3']
  }
};

export default function AdminMultimediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<MediaType>('BANNER');
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [editTab, setEditTab] = useState<'crop' | 'adjust'>('crop');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/media');
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Error fetching media assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (type: MediaType, section: string, file: File) => {
    const url = URL.createObjectURL(file);
    setImagePreview({
      file,
      url,
      type,
      section,
      objectFit: 'cover',
      position: 'center',
      scale: 1,
      positionX: 50,
      positionY: 50,
      rotation: 0,
      brightness: 100,
      contrast: 100
    });
    setEditTab('crop');
  };

  const handleConfirmUpload = async () => {
    if (!imagePreview) return;

    const { file, type, section, objectFit, scale, positionX, positionY } = imagePreview;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    formData.append('section', section);
    formData.append('title', `${type} - ${section}`);
    formData.append('objectFit', objectFit);
    
    // Convertir posición a objectPosition CSS
    const objectPosition = `${positionX}% ${positionY}%`;
    formData.append('objectPosition', objectPosition);

    setUploadingSection(section);

    try {
      const token = localStorage.getItem('shop_token');
      const response = await fetch('http://localhost:4000/api/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await fetchAssets();
        setImagePreview(null);
        alert('Imagen subida exitosamente');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingSection(null);
    }
  };

  const handleCancelPreview = () => {
    if (imagePreview?.url) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) {
      return;
    }

    try {
      const token = localStorage.getItem('shop_token');
      const response = await fetch(`http://localhost:4000/api/media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchAssets();
        alert('Imagen eliminada exitosamente');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Error al eliminar la imagen');
    }
  };

  const getAssetForSection = (type: MediaType, section: string): MediaAsset | undefined => {
    return assets.find(a => a.type === type && a.section === section);
  };

  const getRecommendedSize = (type: MediaType): { width: number; height: number; display: string } => {
    switch (type) {
      case 'BANNER':
        return { width: 1920, height: 1080, display: '1920×1080px (16:9)' };
      case 'CATEGORY_IMAGE':
        return { width: 1280, height: 720, display: '1280×720px (16:9)' };
      case 'LOGO':
        return { width: 500, height: 500, display: '500×500px (1:1)' };
      case 'PROMOTION':
        return { width: 1200, height: 600, display: '1200×600px (2:1)' };
      default:
        return { width: 1000, height: 1000, display: '1000×1000px' };
    }
  };

  const renderMediaSection = (type: MediaType) => {
    const config = mediaTypeSections[type];
    const recommendedSize = getRecommendedSize(type);
    
    return (
      <div className="media-type-section">
        <h2>{config.name}</h2>
        <div className="recommended-size-banner">
          <span className="icon">📐</span>
          <span>Resolución recomendada: <strong>{recommendedSize.display}</strong></span>
          <span className="tip">Para mejor calidad y rendimiento</span>
        </div>
        <div className="media-grid">
          {config.sections.map(section => {
            const asset = getAssetForSection(type, section);
            const isUploading = uploadingSection === section;

            return (
              <div key={section} className="media-card">
                <div className="media-card__header">
                  <h3>{section}</h3>
                  <span className="size-badge">{recommendedSize.display}</span>
                </div>
                <div className="media-card__body">
                  {asset ? (
                    <div className="media-preview">
                      <img src={asset.url} alt={asset.title || section} />
                      <div className="media-preview__overlay">
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="media-placeholder">
                      <p>Sin imagen</p>
                    </div>
                  )}
                </div>
                <div className="media-card__footer">
                  <label className="btn btn-primary btn-sm">
                    {isUploading ? 'Subiendo...' : asset ? 'Cambiar Imagen' : 'Subir Imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(type, section, file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {asset && (
                    <small className="text-muted">
                      Actualizado: {new Date(asset.updatedAt).toLocaleDateString()}
                    </small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Cargando multimedia...</div>;
  }

  return (
    <div className="admin-multimedia-page">
      <div className="page-header">
        <h1>Gestión de Multimedia</h1>
        <p>Administra las imágenes de tu tienda</p>
      </div>

      <div className="media-type-tabs">
        {(Object.keys(mediaTypeSections) as MediaType[]).map(type => (
          <button
            key={type}
            className={`tab-button ${selectedType === type ? 'active' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            {mediaTypeSections[type].name}
          </button>
        ))}
      </div>

      <div className="media-content">
        {renderMediaSection(selectedType)}

      {/* Modal de Preview */}
      {imagePreview && (
        <div className="preview-modal-overlay" onClick={handleCancelPreview}>
          <div className="preview-modal preview-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal__header">
              <div>
                <h2>Editar Imagen - {imagePreview.section}</h2>
                <span className="header-size-info">
                  📐 Recomendado: <strong>{getRecommendedSize(imagePreview.type).display}</strong>
                </span>
              </div>
              <button className="close-button" onClick={handleCancelPreview}>✕</button>
            </div>
            
            <div className="preview-modal__body-horizontal">
              {/* Vista previa grande a la izquierda */}
              <div className="preview-main">
                <div className="preview-label">
                  <span className="preview-badge">👁️ Vista previa del cliente</span>
                </div>
                <div className={`preview-box-large ${imagePreview.type === 'BANNER' ? 'preview-banner' : 'preview-category'}`}>
                  <img 
                    src={imagePreview.url} 
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: imagePreview.objectFit,
                      objectPosition: `${imagePreview.positionX}% ${imagePreview.positionY}%`,
                      transition: 'object-position 0.1s ease'
                    }}
                  />
                  
                  {/* Vista previa sin overlay de texto */}
                </div>
              </div>

              <div className="preview-controls-sidebar">
                <div className="edit-content">
                  <div className="info-box">
                    <p>💡 <strong>Tip:</strong> Los ajustes de posición te permiten elegir qué parte de la imagen se muestra cuando está en modo "Rellenar".</p>
                  </div>
                  
                  <div className="control-group-compact">
                    <label>Modo:</label>
                    <div className="button-group">
                      <button
                        className={`btn-toggle ${imagePreview.objectFit === 'cover' ? 'active' : ''}`}
                        onClick={() => setImagePreview({...imagePreview, objectFit: 'cover'})}
                      >
                        Rellenar
                      </button>
                      <button
                        className={`btn-toggle ${imagePreview.objectFit === 'contain' ? 'active' : ''}`}
                        onClick={() => setImagePreview({...imagePreview, objectFit: 'contain'})}
                      >
                        Completa
                      </button>
                    </div>
                  </div>

                  {imagePreview.objectFit === 'cover' && (
                    <>
                      <div className="control-group-compact">
                        <label>
                          Horizontal <span className="value">{imagePreview.positionX}%</span>
                        </label>
                        <div className="slider-wrapper">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={imagePreview.positionX}
                            onChange={(e) => setImagePreview({...imagePreview, positionX: parseInt(e.target.value)})}
                            className="slider"
                            style={{
                              background: `linear-gradient(to right, #00a99d 0%, #00a99d ${imagePreview.positionX}%, #e5e7eb ${imagePreview.positionX}%, #e5e7eb 100%)`
                            }}
                          />
                        </div>
                      </div>

                      <div className="control-group-compact">
                        <label>
                          Vertical <span className="value">{imagePreview.positionY}%</span>
                        </label>
                        <div className="slider-wrapper">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={imagePreview.positionY}
                            onChange={(e) => setImagePreview({...imagePreview, positionY: parseInt(e.target.value)})}
                            className="slider"
                            style={{
                              background: `linear-gradient(to right, #00a99d 0%, #00a99d ${imagePreview.positionY}%, #e5e7eb ${imagePreview.positionY}%, #e5e7eb 100%)`
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    className="btn btn-secondary"
                    onClick={() => setImagePreview({
                      ...imagePreview, 
                      positionX: 50, 
                      positionY: 50
                    })}
                    style={{marginTop: 'auto'}}
                  >
                    🔄 Centrar
                  </button>
                </div>
              </div>
            </div>

            <div className="preview-modal__footer">
              <button className="btn btn-secondary" onClick={handleCancelPreview}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmUpload}
                disabled={uploadingSection === imagePreview.section}
              >
                {uploadingSection === imagePreview.section ? 'Subiendo...' : 'Aplicar y Subir'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
