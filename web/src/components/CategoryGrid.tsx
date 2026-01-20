import React, { useState, useEffect } from 'react';
import type { Category } from '../services/categories';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (id: string) => void;
}

interface CategoryDisplay {
  title: string;
  keyword: string;
  imageUrl: string;
  color: string;
  objectFit?: string;
  objectPosition?: string;
}

// Default categories
const DEFAULT_CATEGORIES: CategoryDisplay[] = [
  {
    title: "Categoria 1",
    keyword: "Categoria 1",
    imageUrl: "https://placehold.co/600x400/purple/white?text=Categoria+1",
    color: "#a855f7"
  },
  {
    title: "Categoria 2",
    keyword: "Categoria 2",
    imageUrl: "https://placehold.co/600x400/c084fc/white?text=Categoria+2",
    color: "#d8b4fe"
  },
  {
    title: "Categoria 3",
    keyword: "Categoria 3",
    imageUrl: "https://placehold.co/600x400/22d3ee/white?text=Categoria+3",
    color: "#67e8f9"
  },
  {
    title: "Categoria 4",
    keyword: "Categoria 4",
    imageUrl: "https://placehold.co/600x400/ec4899/white?text=Categoria+4",
    color: "#f472b6"
  },
  {
    title: "Categoria 5",
    keyword: "Categoria 5",
    imageUrl: "https://placehold.co/600x400/93c5fd/white?text=Categoria+5",
    color: "#93c5fd"
  },
  {
    title: "Categoria 6",
    keyword: "Categoria 6",
    imageUrl: "https://placehold.co/600x400/fb7185/white?text=Categoria+6",
    color: "#fb7185"
  }
];

export default function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  const [featuredCategories, setFeaturedCategories] = useState<CategoryDisplay[]>(DEFAULT_CATEGORIES);
  
  useEffect(() => {
    // Cargar imágenes de categorías desde la API
    const fetchCategoryImages = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/media/type/CATEGORY_IMAGE');
        if (response.ok) {
          const images = await response.json();
          console.log('=== CATEGORY IMAGES FROM API ===');
          console.log('Total images:', images.length);
          images.forEach((img: any, idx: number) => {
            console.log(`Image ${idx + 1}:`, {
              section: img.section,
              url: img.url,
              objectFit: img.objectFit,
              objectPosition: img.objectPosition,
              updatedAt: img.updatedAt
            });
          });
          
          if (images.length > 0) {
            const updatedCategories = DEFAULT_CATEGORIES.map((cat, index) => {
              const matchingImage = images.find((img: any) => 
                img.section === `category-${index + 1}`
              );
              if (matchingImage) {
                console.log(`✅ Matched category-${index + 1} with image:`, matchingImage.url);
              } else {
                console.log(`❌ No match found for category-${index + 1}`);
              }
              return matchingImage ? {
                ...cat,
                imageUrl: `${matchingImage.url}?t=${matchingImage.updatedAt || Date.now()}`,
                objectFit: matchingImage.objectFit || 'cover',
                objectPosition: matchingImage.objectPosition || 'center'
              } : cat;
            });
            setFeaturedCategories(updatedCategories);
          }
        }
      } catch (error) {
        console.error('Error loading category images:', error);
      }
    };
    fetchCategoryImages();
  }, []);
  
  const getCategoryId = (keyword: string) => {
    const cat = categories.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
    return cat?.id;
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {featuredCategories.map((item) => {
          const categoryId = getCategoryId(item.keyword);
          
          return (
            <div 
              key={item.title} 
              onClick={() => categoryId ? onSelectCategory(categoryId) : alert(`Category matching "${item.keyword}" not found`)}
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                aspectRatio: '16 / 9',
                backgroundColor: item.color,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
            >
              {/* Image background */}
              <img 
                src={item.imageUrl} 
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: (item.objectFit as any) || 'cover',
                  objectPosition: item.objectPosition || 'center',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
