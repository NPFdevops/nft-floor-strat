# DexScreener Mobile Detection Test

This document shows how to test the mobile functionality for DexScreener charts.

## How Mobile Detection Works

The DexScreenerChart component now includes:

1. **Mobile Detection**: Checks both screen width (≤768px) and user agent
2. **Dynamic URL**: Adds `chartDefaultOnMobile=1` parameter for mobile devices
3. **Responsive Iframe**: Re-renders when switching between mobile/desktop

## Test URLs Generated

### Desktop URL:
```
https://dexscreener.com/ethereum/0x4d40c47b13be30724b89019be0549ead71e363e50cef119a56bd64ead4e35016?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTimeframesToolbar=0&chartTheme=light&theme=light&chartStyle=1&chartType=usd&interval=120
```

### Mobile URL (with chartDefaultOnMobile=1):
```
https://dexscreener.com/ethereum/0x4d40c47b13be30724b89019be0549ead71e363e50cef119a56bd64ead4e35016?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTimeframesToolbar=0&chartDefaultOnMobile=1&chartTheme=light&theme=light&chartStyle=1&chartType=usd&interval=120
```

## Testing Instructions

1. **Desktop Testing**:
   - Open the app on desktop (>768px width)
   - Check developer console for "🎯 DexScreener - Mobile detection"
   - Should show `isMobile: false` and URL without `chartDefaultOnMobile` parameter

2. **Mobile Testing**:
   - Resize browser window to ≤768px OR use mobile device
   - Check developer console for "🎯 DexScreener - Mobile detection"
   - Should show `isMobile: true` and URL with `chartDefaultOnMobile=1` parameter

3. **Responsive Testing**:
   - Resize browser window back and forth between desktop/mobile widths
   - Chart should reload with appropriate URL parameters

## Mobile Detection Logic

```javascript
const checkIsMobile = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileBreakpoint = window.innerWidth <= 768;
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  setIsMobile(mobileBreakpoint || isMobileDevice);
};
```

## Expected Behavior

- **Mobile devices**: Chart loads with mobile-optimized default view
- **Desktop**: Chart loads with standard desktop view  
- **Responsive**: Chart adapts when window is resized
- **Performance**: Chart only re-renders when mobile state actually changes