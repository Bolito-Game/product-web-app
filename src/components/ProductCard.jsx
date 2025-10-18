import React from 'react';
import { Link } from 'react-router-dom';
import ImageLoader from './ImageLoader';

const ProductCard = ({ product, isCheckable = false, isChecked, onToggleCheck }) => {
  const localization = product.localizations?.[0] || {
    productName: 'N/A',
    description: '',
    price: 0,
    currency: 'USD'
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: localization.currency || 'USD',
  }).format(localization.price);
  
  // Determine if the product is inactive to disable the checkmark
  const isInactive = product.productStatus?.toUpperCase() === 'INACTIVE';
  const statusClass = isInactive ? 'status-inactive' : '';

  // Get first sentence and truncate to 60 characters
  const getShortDescription = (text) => {
    if (!text) return '';
    const firstSentence = text.match(/[^.!?]+[.!?]+/)?.[0] || text;
    return firstSentence.length > 80 
      ? firstSentence.slice(0, 80) + '...' 
      : firstSentence;
  };

  // This handler prevents the Link navigation when only the checkmark is clicked
  const handleCheckmarkClick = (e) => {
    e.preventDefault();
    if (!isInactive && onToggleCheck) {
      onToggleCheck(product.sku);
    }
  };

  return (
    <Link to={`/product/${product.sku}`} state={{ product }} className="product-card-link">
      <div className={`product-card ${statusClass}`}>
        {isCheckable && (
          <div
            className={`checkmark ${isChecked ? 'checked' : ''} ${isInactive ? 'disabled' : ''}`}
            onClick={handleCheckmarkClick}
          >
            &#10003;
          </div>
        )}

        <ImageLoader src={product.imageUrl} alt={localization.productName} />
        <div className="product-info">
          <h3>{localization.productName}</h3>
          <p>{getShortDescription(localization.description)}</p>
          <div className="product-price">{formattedPrice}</div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;