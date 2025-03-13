import React from 'react';
import { ActivityIndicator } from 'react-native';

/**
 * A safe version of ActivityIndicator that ensures numeric size values
 * @param {Object} props - Component props
 * @returns {React.Component} ActivityIndicator with numeric size
 */
const SafeActivityIndicator = (props) => {
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

export default SafeActivityIndicator;
