import { useState, useEffect } from "react";

const slides = [
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
             <img src={slide.image} alt={slide.title} className="banner-image" />
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
          height: 350px;
          overflow: hidden;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 1024px) {
          .banner-container {
            height: 280px;
          }
        }

        @media (max-width: 768px) {
          .banner-container {
            height: 200px;
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
        }
        
        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
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
