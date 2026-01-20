import { useState, useEffect } from "react";

interface BannerSlide {
  image: string;
  title: string;
  objectFit?: string;
  objectPosition?: string;
}

const defaultSlides: BannerSlide[] = [
  {
    image: "https://placehold.co/1600x400/af11af/white?text=OFERTAS+IMPERDIBLES&font=montserrat",
    title: "Ofertas Imperdibles",
  },
  {
    image: "https://placehold.co/1600x400/af11af/white?text=LO+MEJOR+EN+JUGUETERIA&font=Montserrat",
    title: "Juguetes Adultos",
  },
  {
    image: "https://placehold.co/1600x800/af11af/white?text=ENVIOS+A+TODO+EL+PAIS&font=montserrat",
    title: "Envíos Rápidos",
  },
];

export default function Banner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<BannerSlide[]>(defaultSlides);

  useEffect(() => {
    // Cargar banners desde la API
    const fetchBanners = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/media/type/BANNER');
        if (response.ok) {
          const banners = await response.json();
          if (banners.length > 0) {
            // Filtrar solo banners activos y ordenar
            const activebanners = banners
              .filter((b: any) => b.isActive)
              .sort((a: any, b: any) => {
                // Ordenar por displayOrder, luego por section
                if (a.displayOrder !== b.displayOrder) {
                  return a.displayOrder - b.displayOrder;
                }
                return a.section.localeCompare(b.section);
              });
            
            const loadedSlides = activebanners.map((banner: any) => ({
              image: `${banner.url}?t=${banner.updatedAt || Date.now()}`,
              title: banner.title || 'Banner',
              objectFit: banner.objectFit || 'contain',
              objectPosition: banner.objectPosition || 'center'
            }));
            
            if (loadedSlides.length > 0) {
              console.log('Banners cargados:', loadedSlides.length);
              setSlides(loadedSlides);
            }
          }
        }
      } catch (error) {
        console.error('Error loading banners:', error);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="banner-container">
      <div 
        className="banner-slider" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="banner-slide">
             <img 
               src={slide.image} 
               alt={slide.title} 
               className="banner-image"
               style={{
                 objectFit: (slide.objectFit || 'contain') as any,
                 objectPosition: slide.objectPosition || 'center'
               }}
             />
          </div>
        ))}
      </div>
      
      <div className="banner-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`banner-dot ${currentIndex === index ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      <style>{`
        .banner-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
          background: #1a1a1a;
        }

        @media (max-width: 768px) {
          .banner-container {
            margin-bottom: 20px;
          }
        }
        
        .banner-slider {
          display: flex;
          height: 100%;
          transition: transform 0.5s ease-in-out;
        }
        
        .banner-slide {
          min-width: 100%;
          height: 100%;
          justify-content: center;
        }
        
        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }

        .banner-dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
        }

        .banner-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          background-color: var(--banner-dot-inactive, rgba(255, 255, 255, 0.5));
          cursor: pointer;
          padding: 0;
          transition: all 0.3s;
        }

        .banner-dot.active {
          background-color: var(--banner-dot-active, #ffffff);
          transform: scale(1.2);
        }

        @media (max-width: 768px) {
          .banner-container {
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
}
