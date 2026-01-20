import React from 'react';
import type { Category } from '../services/categories';

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory: (id: string) => void;
}

// Map the display names to potential keywords or exact names in your DB.
// Since we don't know the exact DB names, we'll try to match loosely or you can adjust these.
// We also assign a placeholder image for each.
const FEATURED_CATEGORIES = [
  {
    title: "Categoria 1",
    keyword: "Categoria 1", // We will try to find a category containing this
    imageUrl: "https://placehold.co/600x400/purple/white?text=Categoria+1",
    color: "#a855f7" // purple-500
  },
  {
    title: "Categoria 2",
    keyword: "Categoria 2",
    imageUrl: "https://placehold.co/600x400/c084fc/white?text=Categoria+2",
    color: "#d8b4fe" // purple-300
  },
  {
    title: "Categoria 3",
    keyword: "Categoria 3",
    imageUrl: "https://placehold.co/600x400/22d3ee/white?text=Categoria+3",
    color: "#67e8f9" // cyan-300
  },
  {
    title: "Categoria 4",
    keyword: "Categoria 4",
    imageUrl: "https://placehold.co/600x400/ec4899/white?text=Categoria+4",
    color: "#f472b6" // pink-400
  },
  {
    title: "Categoria 5",
    keyword: "Categoria 5",
    imageUrl: "https://placehold.co/600x400/93c5fd/white?text=Categoria+5",
    color: "#93c5fd" // blue-300
  },
  {
    title: "Categoria 6",
    keyword: "Categoria 6",
    imageUrl: "https://placehold.co/600x400/fb7185/white?text=Categoria+6",
    color: "#fb7185" // rose-400
  }
];

export default function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  
  const getCategoryId = (keyword: string) => {
    // Case insensitive partial match
    const cat = categories.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
    return cat?.id;
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {FEATURED_CATEGORIES.map((item) => {
          const categoryId = getCategoryId(item.keyword);
          
          return (
            <div 
              key={item.title} 
              onClick={() => categoryId ? onSelectCategory(categoryId) : alert(`Category matching "${item.keyword}" not found`)}
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                height: '200px',
                backgroundColor: item.color,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              {/* Image background */}
              <img 
                src={item.imageUrl} 
                alt={item.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              
              {/* Overlay Text - mimicking the example style somewhat */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '10px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                color: 'white',
                display: 'flex',
                alignItems: 'flex-end',
                height: '50%'
              }}>
                <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.2rem', textShadow: '1px 1px 2px black' }}>
                  {item.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
