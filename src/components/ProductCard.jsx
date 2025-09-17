import React from 'react';
import ImageLoader from './ImageLoader';

const ProductCard = ({ product }) => {
  // Use the first available localization from the API response
  const localization = product.localizations && product.localizations[0] 
    ? product.localizations[0]
    : { productName: 'N/A', description: '', price: 0, currency: 'USD' };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: localization.currency || 'USD',
  }).format(localization.price);

  return (
    <div className="product-card">
      <ImageLoader src={product.imageUrl} alt={localization.productName} />
      <div className="product-info">
        <h3>{localization.productName}</h3>
        <p>{localization.description}</p>
        <div className="product-price">{formattedPrice}</div>
      </div>
    </div>
  );
};

export default ProductCard;