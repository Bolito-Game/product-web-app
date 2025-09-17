import React, { useEffect } from 'react';
import useResponsive from '../hooks/useResponsive';

const AdComponent = () => {
  const { isMobile } = useResponsive();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  // Use Google's official test ad client and a generic test slot
  const testClient = "ca-pub-3940256099942944"; 
  const testSlot = "6300978111";

  return (
    <div className={`ad-container ${isMobile ? 'mobile-ad' : 'desktop-ad'}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={testClient}
        data-ad-slot={testSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdComponent;