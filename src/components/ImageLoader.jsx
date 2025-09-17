import React, { useState } from 'react';

const ImageLoader = ({ src, alt }) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className={`image-frame ${loading ? 'loading' : 'loaded'}`}>
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoading(false)}
        style={{ display: loading ? 'none' : 'block', opacity: loading ? 0 : 1, transition: 'opacity 0.5s' }}
      />
    </div>
  );
};

export default ImageLoader;