import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { createShareableUrl, generateShareTitle } from '../utils/urlUtils';
import { posthogService } from '../services/posthogService';
import './TradingViewChart.css';

const ScreenshotShare = ({ targetId, collection1, collection2, timeframe, layout }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const captureScreenshot = async () => {
    const targetElement = document.getElementById(targetId);
    
    if (!targetElement) {
      // Track failed screenshot attempt
      posthogService.trackShareEvent('failed', {
        type: 'screenshot',
        targetElement: targetId,
        collections: [collection1?.slug, collection2?.slug].filter(Boolean),
        timeframe: timeframe,
        layout: layout
      }, {
        error_reason: 'no_target_element',
        has_collection1: !!collection1,
        has_collection2: !!collection2
      });
      
      // Add haptic feedback for error
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 100, 100]);
      }
      alert('No charts to capture. Please load some collection data first.');
      return;
    }

    // Track screenshot attempt
    posthogService.trackShareEvent('started', {
      type: 'screenshot',
      targetElement: targetId,
      collections: [collection1?.slug, collection2?.slug].filter(Boolean),
      timeframe: timeframe,
      layout: layout
    }, {
      has_both_collections: !!(collection1 && collection2)
    });

    setIsCapturing(true);
    
    // Add haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    try {
      const canvas = await html2canvas(targetElement, {
        backgroundColor: '#ffffff',
        scale: window.devicePixelRatio || 2, // Use device pixel ratio for better quality
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        
        // Trigger download with descriptive filename
        const shareTitle = generateShareTitle({ collection1, collection2, timeframe });
        const sanitizedTitle = shareTitle.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
        const filename = `${sanitizedTitle}-${new Date().toISOString().slice(0, 10)}.png`;
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Track successful screenshot
        posthogService.trackShareEvent('completed', {
          type: 'screenshot',
          targetElement: targetId,
          collections: [collection1?.slug, collection2?.slug].filter(Boolean),
          timeframe: timeframe,
          layout: layout
        }, {
          filename: filename,
          has_both_collections: !!(collection1 && collection2)
        });
        
        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
      }, 'image/png');

    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };


  const shareUrl = () => {
    const shareTitle = generateShareTitle({ collection1, collection2, timeframe });
    const shareUrl = createShareableUrl({ collection1, collection2, timeframe, layout });
    const shareText = `${shareTitle} - View interactive comparison`;
    
    // Track URL sharing attempt
    posthogService.trackShareEvent('started', {
      type: 'url',
      targetElement: targetId,
      collections: [collection1?.slug, collection2?.slug].filter(Boolean),
      timeframe: timeframe,
      layout: layout
    }, {
      has_both_collections: !!(collection1 && collection2),
      share_method: navigator.share ? 'native_share' : 'clipboard'
    });
    
    // Add haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }).catch((error) => {
        console.error('Error sharing URL:', error);
        copyToClipboard();
      });
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const shareTitle = generateShareTitle({ collection1, collection2, timeframe });
    const shareUrl = createShareableUrl({ collection1, collection2, timeframe, layout });
    const text = `${shareTitle} - View interactive comparison: ${shareUrl}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        // Success haptic feedback
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(25);
        }
        showToast('Link copied to clipboard!');
      }).catch(() => {
        showToast('Unable to copy to clipboard.');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(25);
        }
        showToast('Link copied to clipboard!');
      } catch (err) {
        showToast('Unable to copy to clipboard.');
      }
      document.body.removeChild(textArea);
    }
  };

  const showToast = (message) => {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-4 right-4 bg-black bg-opacity-90 text-white text-sm font-medium px-4 py-3 rounded-xl z-50 text-center safe-area-top';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  const ActionSheet = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:hidden"
      onClick={() => setShowActionSheet(false)}
    >
      <div 
        className="bg-white w-full rounded-t-xl animate-slide-up safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-6">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-6">Share Options</h3>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowActionSheet(false);
                captureScreenshot();
              }}
              disabled={isCapturing}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors mobile-share-button"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  {isCapturing ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <span className="material-symbols-outlined text-white text-lg">screenshot</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Save Screenshot</p>
                  <p className="text-sm text-gray-600">Download chart as image</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
            
            <button
              onClick={() => {
                setShowActionSheet(false);
                shareUrl();
              }}
              className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors mobile-share-button"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">link</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Share Link</p>
                  <p className="text-sm text-gray-600">Copy comparison URL</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
          
          <button
            onClick={() => setShowActionSheet(false)}
            className="w-full mt-6 py-3 text-center text-red-600 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile-first design - matching brutalist UI style */}
      <div className="block sm:hidden">
        <button
          onClick={() => setShowActionSheet(true)}
          className="w-full flex items-center justify-center gap-2 h-12 px-4 rounded-none border-2 border-black bg-blue-500 text-white font-bold text-sm leading-normal hover:bg-blue-600 transition-all duration-200 shadow-[4px_4px_0px_#000000] hover:scale-105"
          style={{
            transform: showActionSheet ? 'scale(0.98)' : 'scale(1)',
          }}
        >
          <span className="material-symbols-outlined text-lg">share</span>
          <span>Share</span>
        </button>
      </div>

      {/* Desktop version */}
      <div className="hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button 
          onClick={captureScreenshot}
          disabled={isCapturing}
          className="flex items-center justify-center rounded-none h-10 border-2 border-black bg-white text-black gap-2 text-sm font-bold leading-normal min-w-0 px-3 sm:px-4 hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_#000000]"
          title="Capture and download screenshot"
        >
          {isCapturing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
              <span className="truncate hidden sm:inline">Capturing...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">screenshot</span>
              <span className="truncate hidden sm:inline">Screenshot</span>
            </>
          )}
        </button>

        <button 
          onClick={shareUrl}
          className="flex items-center justify-center rounded-none h-10 border-2 border-black bg-blue-500 text-white gap-2 text-sm font-bold leading-normal min-w-0 px-3 sm:px-4 hover:bg-blue-600 transition-colors shadow-[4px_4px_0px_#000000]"
          title="Share comparison URL"
        >
          <span className="material-symbols-outlined">link</span>
          <span className="truncate hidden sm:inline">Share URL</span>
        </button>
      </div>

      {showActionSheet && <ActionSheet />}
    </>
  );
};

export default ScreenshotShare;
