/**
 * Golden State Warriors Local Stream Configuration
 * This provides a local stream source for GSW games across all providers
 */

const GSW_EMBED_URL = 'https://ntvstream.cx/embed?t=Y1B0WEtieXFWZDZFNkh3bzAwZkVhb2pycU1jM3dkNlI1RUg0TXhUTlcwQ1ZWSlliOXR2WWtXWDdWWDljUkVVQw~~';

const GSW_TEAM_KEYWORDS = [
  'golden state warriors',
  'gs warriors',
  'warriors',
  'gsw',
  'golden state'
];

/**
 * Check if a stream/event name includes Golden State Warriors
 * @param {string} name - Stream or event name
 * @returns {boolean} - True if it's a Warriors game
 */
export const isGSWGame = (name) => {
    console.log(name);
  if (!name) return false;
  
  const normalized = name.toLowerCase();
  console.log(GSW_TEAM_KEYWORDS.some(keyword => normalized.includes(keyword)));
  return GSW_TEAM_KEYWORDS.some(keyword => normalized.includes(keyword));
};

/**
 * Get the GSW local stream embed URL
 * @returns {string} - The embed URL for the GSW local stream
 */
export const getGSWLocalEmbedUrl = () => {
  return GSW_EMBED_URL;
};

/**
 * Create a GSW local source object for Streamed provider
 * @returns {Object} - Source object compatible with Streamed provider
 */
export const createGSWLocalSource = () => {
  return {
    source: 'gsw-local',
    id: 'warriors-local',
    embedUrl: GSW_EMBED_URL,
    language: 'english'
  };
};
