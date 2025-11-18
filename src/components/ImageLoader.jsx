import React, { useState } from 'react';

// The path to our new placeholder image in the public folder.
const placeholderSrc = '/assets/icons/placeholder.svg';

const ImageLoader = ({ src, alt }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false); // State to handle broken product image URLs

  // If the main product image fails to load, we'll stop trying and just show the placeholder.
  const handleImageError = () => {
    setError(true);
    setLoading(false); // Stop the loading animation
  };

  // Determine which image source to use
  const imageToDisplay = error ? placeholderSrc : src;

  return (
    <div className={`image-frame ${loading ? 'loading' : 'loaded'}`}>
      {/* While loading OR if the final image is broken, display the placeholder */}
      {(loading || error) && (
        <img 
          src={placeholderSrc} 
          alt="Loading placeholder" 
          className="placeholder-image"
        />
      )}
      
      {/* The actual image. We hide it if there's an error. */}
      {!error && (
        <img
          src={imageToDisplay}
          alt={alt}
          className="final-image"
          onLoad={() => setLoading(false)}
          onError={handleImageError}
          style={{ opacity: loading ? 0 : 1 }}
        />
      )}
    </div>
  );
};

export default ImageLoader;