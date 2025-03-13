import React from 'react';
import { ActivityIndicator } from 'react-native';

/**
 * A wrapper for ActivityIndicator that ensures numeric size values
 * @param {Object} props - Component props
 * @returns {JSX.Element} Safe ActivityIndicator component
 */
export const SafeActivityIndicator = (props) => {
  // Convert any non-numeric size value to a number
  const size = typeof props.size === 'string' 
    ? (props.size === 'large' ? 36 : 20) // 'large' becomes 36, others become 20
    : props.size || 24; // Default to 24 if not provided

  return (
    <ActivityIndicator
      {...props}
      size={size}
    />
  );
};

/**
 * Monkey patch React Native's ActivityIndicator to always use numeric sizes
 * Call this function once at the app startup
 */
export const monkeyPatchActivityIndicator = () => {
  const originalRender = ActivityIndicator.render;
  
  // Replace the render method with our safe version
  ActivityIndicator.render = function(props, ref) {
    const safeProps = {...props};
    
    // Convert string sizes to numbers
    if (typeof props.size === 'string') {
      safeProps.size = props.size === 'large' ? 36 : 20;
    }
    
    return originalRender.call(this, safeProps, ref);
  };
};
