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

  // This handler prevents the Link navigation when only the checkmark is clicked
  const handleCheckmarkClick = (e) => {
    e.preventDefault(); // Stop the click from triggering the Link navigation
    if (!isInactive && onToggleCheck) {
      onToggleCheck(product.sku); // Call the toggle function from ShoppingCartPage
    }
  };

  return (
    <Link to={`/product/${product.sku}`} state={{ product }} className="product-card-link">
      <div className={`product-card ${statusClass}`}>
        {/* The checkmark is added here, inside the relatively positioned card */}
        {isCheckable && (
          <div
            className={`checkmark ${isChecked ? 'checked' : ''} ${isInactive ? 'disabled' : ''}`}
            onClick={handleCheckmarkClick}
          >
            &#10003; {/* Check symbol */}
          </div>
        )}

        <ImageLoader src={product.imageUrl} alt={localization.productName} />
        <div className="product-info">
          <h3>{localization.productName}</h3>
          <p>{localization.description}</p>
          <div className="product-price">{formattedPrice}</div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;