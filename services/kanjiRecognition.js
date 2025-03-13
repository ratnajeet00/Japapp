import { groqClient } from './groqApi';

/**
 * Recognize a kanji from a drawing using GROQ API
 * @param {Array} points - Array of points representing the drawing
 * @returns {Promise<Object>} Recognized kanji and confidence
 */
export const recognizeDrawnKanji = async (points) => {
  try {
    // Convert drawing points to a format suitable for API
    const simplifiedPoints = simplifyPoints(points);
    const drawingDescription = convertPointsToDescription(simplifiedPoints);
    
    // Use GROQ API to identify the kanji based on the drawing
    const response = await groqClient.post('', {
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a Japanese kanji recognition expert. Analyze drawing descriptions and identify the most likely kanji character that matches.'
        },
        {
          role: 'user',
          content: `Based on this stroke pattern description, identify the most likely Japanese kanji:
          ${drawingDescription}
          
          Respond with a JSON object containing:
          1. The most likely kanji
          2. Up to 3 alternative kanji that might match
          3. Confidence level (1-100) for the most likely kanji`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error recognizing drawn kanji:', error);
    throw error;
  }
};

/**
 * Simplify a set of drawing points to reduce complexity
 * @param {Array} points - Array of points with x, y coordinates
 * @returns {Array} Simplified array of points
 */
const simplifyPoints = (points) => {
  if (points.length <= 2) return points;
  
  // Apply a simple Douglas-Peucker-like algorithm
  const result = [points[0]];
  let lastIndex = 0;
  
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[lastIndex].x;
    const dy = points[i].y - points[lastIndex].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If points are far enough apart, keep this point
    if (distance > 10) {
      result.push(points[i]);
      lastIndex = i;
    }
  }
  
  // Always include the last point
  if (lastIndex < points.length - 1) {
    result.push(points[points.length - 1]);
  }
  
  return result;
};

/**
 * Convert drawing points to a text description for the API
 * @param {Array} points - Array of simplified points
 * @returns {string} Text description of the drawing
 */
const convertPointsToDescription = (points) => {
  if (points.length === 0) return "No drawing provided";
  
  // Identify strokes (assuming strokes are separated by time gaps or lifting the stylus)
  const strokes = [];
  let currentStroke = [points[0]];
  
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x;
    const dy = points[i].y - points[i-1].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 30) { // Large gap indicates a new stroke
      strokes.push([...currentStroke]);
      currentStroke = [points[i]];
    } else {
      currentStroke.push(points[i]);
    }
  }
  
  if (currentStroke.length > 0) {
    strokes.push(currentStroke);
  }
  
  // Generate description of the drawing
  let description = `Drawing with ${strokes.length} strokes:\n`;
  
  strokes.forEach((stroke, index) => {
    const start = stroke[0];
    const end = stroke[stroke.length - 1];
    
    // Determine direction (up, down, left, right, diagonal)
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    let direction;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    
    if (absX > absY * 2) {
      direction = dx > 0 ? "right" : "left";
    } else if (absY > absX * 2) {
      direction = dy > 0 ? "down" : "up";
    } else {
      if (dx > 0 && dy > 0) direction = "down-right";
      else if (dx > 0 && dy < 0) direction = "up-right";
      else if (dx < 0 && dy > 0) direction = "down-left";
      else direction = "up-left";
    }
    
    description += `Stroke ${index + 1}: ${direction} - length: ${Math.round(length)}px\n`;
    
    // Add information about curvature if the stroke has enough points
    if (stroke.length > 2) {
      const isStraight = isStrokeStraight(stroke);
      description += isStraight ? "  (straight line)\n" : "  (curved line)\n";
    }
  });
  
  return description;
};

/**
 * Check if a stroke is relatively straight
 * @param {Array} stroke - Array of points in the stroke
 * @returns {boolean} Whether the stroke is straight
 */
const isStrokeStraight = (stroke) => {
  if (stroke.length <= 2) return true;
  
  const start = stroke[0];
  const end = stroke[stroke.length - 1];
  
  // Calculate straight-line distance between start and end
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const straightLineDistance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate the actual path length
  let pathLength = 0;
  for (let i = 1; i < stroke.length; i++) {
    const pdx = stroke[i].x - stroke[i-1].x;
    const pdy = stroke[i].y - stroke[i-1].y;
    pathLength += Math.sqrt(pdx * pdx + pdy * pdy);
  }
  
  // If the path is close to a straight line, the ratio will be close to 1
  const straightness = straightLineDistance / pathLength;
  return straightness > 0.9; // Threshold for considering a line "straight"
};
