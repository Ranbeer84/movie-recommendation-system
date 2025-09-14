import React from 'react';
import './WaterWavesBackground.css';

const WaterWavesBackground = () => {
  return (
    <div className="water-waves-container">
      
      {/* Animated water wave layers */}
      <div className="waves-wrapper">
        {/* Wave Layer 1 - Blue to Teal */}
        <div className="wave-layer wave-1" />
        
        {/* Wave Layer 2 - Purple to Pink */}
        <div className="wave-layer wave-2" />
        
        {/* Wave Layer 3 - Orange to Yellow */}
        <div className="wave-layer wave-3" />
        
        {/* Wave Layer 4 - Red to Orange */}
        <div className="wave-layer wave-4" />
        
        {/* Wave Layer 5 - Green to Emerald */}
        <div className="wave-layer wave-5" />
        
        {/* Additional flowing accent waves */}
        <div className="wave-layer wave-6" />
      </div>
      
      {/* Multiple wave layers with different colors and movements */}
      <div className="floating-waves">
        {/* Primary Blue Wave */}
        <div className="floating-wave blue-wave" />
        
        {/* Secondary Purple Wave */}
        <div className="floating-wave purple-wave" />
        
        {/* Tertiary Pink Wave */}
        <div className="floating-wave pink-wave" />
        
        {/* Orange Accent Wave */}
        <div className="floating-wave orange-wave" />
        
        {/* Teal Accent Wave */}
        <div className="floating-wave teal-wave" />
        
        {/* Yellow Highlight Wave */}
        <div className="floating-wave yellow-wave" />
        
        {/* Small flowing particles */}
        <div className="floating-wave small-purple-particle" />
        
        <div className="floating-wave small-red-particle" />
      </div>
    </div>
  );
};

export default WaterWavesBackground;