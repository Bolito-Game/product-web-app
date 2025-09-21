import React from 'react';
import ImageLoader from './ImageLoader';

const ProductCard = ({ product }) => {
  // Safely access the first localization with a fallback
  const localization = product.localizations && product.localizations[0] 
    ? product.localizations[0]
    : { productName: 'N/A', description: '', price: 0, currency: 'USD' };

  // Format the price for display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: localization.currency || 'USD',
  }).format(localization.price);

  // Determine the CSS class based on the product status.
  // The .toUpperCase() call makes this check case-insensitive and robust.
  const statusClass = product.productStatus && product.productStatus.toUpperCase() === 'INACTIVE' 
    ? 'status-inactive' 
    : '';

  return (
    // Apply the conditional status class to the main container
    <div className={`product-card ${statusClass}`}>
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