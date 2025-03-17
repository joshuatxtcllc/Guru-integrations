import React, { useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Save } from 'lucide-react';

const FrameVisualizer = () => {
  const [frameType, setFrameType] = useState('standard');
  const [frameStyle, setFrameStyle] = useState('classic');
  const [frameColor, setFrameColor] = useState('#5c4a37');
  const [matColor, setMatColor] = useState('#ffffff');
  const [hasSecondMat, setHasSecondMat] = useState(false);
  const [secondMatColor, setSecondMatColor] = useState('#e0e0e0');
  const [size, setSize] = useState('11x14');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('/api/placeholder/600/450');
  const [loading, setLoading] = useState(false);
  
  const matColors = {
    "White": '#ffffff',
    "Off White": '#f5f5f0',
    "Black": '#101010',
    "Navy Blue": '#1a2c42',
    "Burgundy": '#6d1a33',
    "Forest Green": '#2c4c3b',
    "Charcoal": '#36454f',
    "Taupe": '#b8a88b'
  };
  
  const frameStyles = [
    { id: 'classic', name: 'Classic', description: 'Traditional wood frame with a timeless profile' },
    { id: 'modern', name: 'Modern', description: 'Sleek metal frame with clean lines' },
    { id: 'ornate', name: 'Ornate', description: 'Decorative frame with intricate detailing' },
    { id: 'floating', name: 'Floating', description: 'Contemporary floating frame for canvas and board art' },
    { id: 'gallery', name: 'Gallery', description: 'Simple gallery-style frame with clean edges' }
  ];
  
  const frameTypes = [
    { id: 'standard', name: 'Standard Frame' },
    { id: 'mat', name: 'Frame with Mat' },
    { id: 'shadowbox', name: 'Shadowbox Frame' }
  ];
  
  const sizeOptions = [
    '8x10',
    '11x14',
    '16x20',
    '18x24',
    '20x30',
    '24x36'
  ];
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      generatePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Generate preview image
  const generatePreview = (imageUrl = null) => {
    setLoading(true);
    
    // In a real implementation, this would call an API endpoint 
    // that generates the 3D render of the frame with the current configuration
    
    // Simulate API call with timeout
    setTimeout(() => {
      // In production, this would be the URL returned from the 3D rendering API
      const newPreviewUrl = imageUrl ? 
        '/api/placeholder/600/450' : // This would be a real rendered image in production
        '/api/placeholder/600/450';
      
      setPreviewUrl(newPreviewUrl);
      setLoading(false);
    }, 1500);
  };
  
  // Update preview when configuration changes
  useEffect(() => {
    generatePreview(uploadedImage);
  }, [frameType, frameStyle, frameColor, matColor, hasSecondMat, secondMatColor, size, uploadedImage]);
  
  // Calculate price based on configuration
  const calculatePrice = () => {
    // Base prices for different frame types
    const basePrices = {
      standard: 45.99,
      mat: 69.99,
      shadowbox: 99.99
    };
    
    // Size multipliers
    const sizeMultipliers = {
      '8x10': 1.0,
      '11x14': 1.3,
      '16x20': 1.7,
      '18x24': 2.0,
      '20x30': 2.5,
      '24x36': 3.0
    };
    
    // Calculate price
    let price = basePrices[frameType] * sizeMultipliers[size];
    
    // Add extra for second mat
    if (frameType === 'mat' && hasSecondMat) {
      price += 15;
    }
    
    return price.toFixed(2);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Configuration options */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Frame Options</h2>
          
          {/* Frame Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Frame Type</label>
            <div className="grid grid-cols-1 gap-2">
              {frameTypes.map(type => (
                <button
                  key={type.id}
                  className={`px-4 py-2 border rounded text-left ${
                    frameType === type.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setFrameType(type.id)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Frame Style */}
          <div>
            <label className="block text-sm font-medium mb-2">Frame Style</label>
            <select
              value={frameStyle}
              onChange={(e) => setFrameStyle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {frameStyles.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name} - {style.description}
                </option>
              ))}
            </select>
          </div>
          
          {/* Frame Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Frame Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                className="h-10 w-10 border border-gray-300 rounded mr-2"
              />
              <span className="text-sm">{frameColor}</span>
            </div>
          </div>
          
          {/* Frame Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {sizeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          {/* Mat options (only show if frame type is 'mat' or 'shadowbox') */}
          {(frameType === 'mat' || frameType === 'shadowbox') && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Mat Color</label>
                <select
                  value={matColor}
                  onChange={(e) => setMatColor(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  {Object.entries(matColors).map(([name, color]) => (
                    <option key={color} value={color}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              
              {frameType === 'mat' && (
                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="second-mat"
                      checked={hasSecondMat}
                      onChange={(e) => setHasSecondMat(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="second-mat" className="text-sm font-medium">
                      Add Second Mat
                    </label>
                  </div>
                  
                  {hasSecondMat && (
                    <select
                      value={secondMatColor}
                      onChange={(e) => setSecondMatColor(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      {Object.entries(matColors).map(([name, color]) => (
                        <option key={color} value={color}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Upload image */}
          <div>
            <label className="block text-sm font-medium mb-2">Upload Artwork</label>
            <div className="flex items-center">
              <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                <span>Select Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
        </div>
        
        {/* Middle column - Preview */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Frame Preview</h2>
          
          <div className="relative bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : null}
            
            <div className="p-8">
              <div 
                className="relative"
                style={{
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  borderWidth: frameType === 'shadowbox' ? '24px' : '16px',
                  borderStyle: 'solid',
                  borderColor: frameColor,
                  padding: frameType === 'mat' || frameType === 'shadowbox' ? '24px' : '0',
                  backgroundColor: frameType === 'mat' || frameType === 'shadowbox' ? matColor : 'transparent'
                }}
              >
                {hasSecondMat && frameType === 'mat' && (
                  <div
                    className="absolute inset-0 m-6"
                    style={{
                      backgroundColor: secondMatColor,
                      border: `18px solid ${secondMatColor}`
                    }}
                  />
                )}
                <img
                  src={uploadedImage || previewUrl}
                  alt="Frame preview"
                  className="w-full max-w-lg"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <div>
              <span className="text-gray-600">Price:</span>
              <span className="ml-2 text-2xl font-bold">${calculatePrice()}</span>
            </div>
            
            <div className="flex space-x-4">
              <button 
                className="flex items-center px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
                onClick={() => generatePreview(uploadedImage)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Refresh Preview
              </button>
              
              <button 
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameVisualizer;
