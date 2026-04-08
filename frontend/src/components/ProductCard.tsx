"use client";

import { Product, CATEGORY_STYLES } from "../types/shop";

// ── Icons ──────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconMinus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconWeight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <circle cx="12" cy="7" r="4"/>
    <path d="M5.5 21h13L17 11H7L5.5 21z"/>
  </svg>
);

// ── Props ──────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function ProductCard({ product, quantity, onAdd, onRemove }: ProductCardProps) {
  const outOfStock = product.stock === 0;
  //const catStyle = CATEGORY_STYLES[product.category];
  const catStyle = CATEGORY_STYLES[product.category as keyof typeof CATEGORY_STYLES] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  };

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/90 shadow-sm hover:shadow-xl hover:shadow-forest/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">

      {/* Product image */}
      <div className="relative w-full h-44 overflow-hidden bg-warm/40">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Category badge overlaid on image */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm ${catStyle.bg} ${catStyle.text}`}>
            <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
            {product.category}
          </span>
        </div>
        {outOfStock && (
          <div className="absolute inset-0 bg-cream/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-xs font-medium text-[#b94040] bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#f5c0c0]">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-medium text-forest text-sm leading-snug mb-1">{product.name}</h3>
        <p className="text-xs text-[#777] font-light leading-relaxed mb-3 flex-1">{product.description}</p>

        {/* Weight */}
        <div className="flex items-center gap-1 text-forest/35 text-xs mb-4">
          <IconWeight />
          <span>{product.weight} lb{product.weight !== 1 ? "s" : ""}</span>
        </div>

        {/* Price + cart controls */}
        <div className="flex items-center justify-between">
          <p className="font-playfair text-xl text-forest">${product.price.toFixed(2)}</p>

          {quantity === 0 ? (
            <button
              onClick={onAdd}
              disabled={outOfStock}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                outOfStock
                  ? "bg-warm/40 text-forest/25 cursor-not-allowed"
                  : "bg-forest text-cream hover:bg-sage shadow-sm shadow-forest/20 hover:-translate-y-0.5"
              }`}
            >
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-warm/60 rounded-xl p-1">
              <button
                onClick={onRemove}
                className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-forest hover:bg-sage hover:text-cream transition-colors duration-200 shadow-sm"
              >
                <IconMinus />
              </button>
              <span className="w-5 text-center text-sm font-medium text-forest">{quantity}</span>
              <button
                onClick={onAdd}
                disabled={quantity >= product.stock}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-sm ${
                  quantity >= product.stock
                    ? "bg-warm/40 text-forest/25 cursor-not-allowed"
                    : "bg-white text-forest hover:bg-sage hover:text-cream"
                }`}
              >
                <IconPlus />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}