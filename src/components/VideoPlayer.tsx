import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Game, getStreamUrl } from '../types/game';

interface VideoPlayerProps {
  game: Game;
}

// Ad-related domains to block
const AD_DOMAINS = [
  "googleadservices", "googlesyndication", "g.doubleclick",
  "googleads", "google-analytics", "googletagmanager",
  "facebook", "scorecardresearch", "amazon-adsystem",
  "adnxs", "casalemedia", "everesttech", "serving-sys",
  "pubmatic", "doubleclick", "adroll", "taboola", 
  "outbrain", "adserver", "bidswitch", "adtech", 
  "advertising", "clickbank", "clicksor"
];

// Streaming domains that should NOT be blocked
const STREAMING_DOMAINS = [
  "akamaized.net", "m3u8", "mpd", "hls", "stream", 
  "video", "media", "content", "cdn", "player",
  "topstreams.info", "tstreams.info",
  "nbalpng"  // Allow NBA streaming content
];

const VideoPlayer: React.FC<VideoPlayerProps> = ({ game }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const streamUrl = getStreamUrl(game);
  
  // This useEffect handles interaction with the iframe once it's loaded
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    const handleIframeLoad = () => {
      setIsLoading(false);
      
      try {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;
        
        // Try to inject ad-blocking script
        timeoutId = setTimeout(() => {
          try {
            injectAdBlockingScript(iframe);
          } catch (error) {
            console.error("Error injecting ad blocking script:", error);
          }
        }, 2000);
      } catch (error) {
        console.error("Error interacting with iframe:", error);
      }
    };
    
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }
    
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
  
  // Try to inject ad-blocking script
  const injectAdBlockingScript = (iframe: HTMLIFrameElement) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;
      
      // Create script to inject
      const script = iframeDoc.createElement('script');
      script.text = `
        (function() {
          // Function to remove ad elements
          function removeAds() {
              // Common ad selectors
              const adSelectors = [
                  '[class*="ad-"]', '[id*="ad-"]',
                  '[class*="banner"]', '[id*="banner"]',
                  'iframe:not([src*="topstreams"]):not([src*="akamaized"]):not([src*="player"]):not([src*="video"])',
                  '[class*="popup"]', '[id*="popup"]',
                  'a[target="_blank"]',
                  'div[style*="position: fixed"]',
                  'div[style*="z-index: 9999"]'
              ];
              
              // Remove elements that match ad selectors
              adSelectors.forEach(selector => {
                  document.querySelectorAll(selector).forEach(el => {
                      // Don't remove if it contains the main video player
                      if (!el.querySelector('video') && 
                          !el.querySelector('iframe[src*="topstreams"]') &&
                          !el.querySelector('iframe[src*="player"]') &&
                          !el.querySelector('iframe[src*="video"]') &&
                          !el.querySelector('.video-js') &&
                          !el.querySelector('.player-container')) {
                          el.style.display = 'none';
                      }
                  });
              });
              
              // Remove all onclick attributes from elements
              document.querySelectorAll('*[onclick]').forEach(el => {
                  el.removeAttribute('onclick');
              });
              
              // Block automatic redirects
              window._open = window.open;
              window.open = function() { 
                  console.log('Popup blocked');
                  return null; 
              };
              
              // Clean up timers that might trigger ads
              for (let i = 0; i < 1000; i++) {
                  clearTimeout(i);
                  clearInterval(i);
              }
          }
          
          // Force autoplay
          function forceAutoplay() {
              const videos = document.querySelectorAll('video');
              if (videos.length > 0) {
                  videos.forEach(function(video) {
                      if (video.paused) {
                          video.play().then(() => {
                              console.log('Video is now playing!');
                              // Make video full screen
                              video.style.position = 'fixed';
                              video.style.top = '0';
                              video.style.left = '0';
                              video.style.width = '100%';
                              video.style.height = '100%';
                              video.style.zIndex = '9999';
                          }).catch(e => {
                              console.log('Auto-play still failed:', e);
                              // Try clicking any play buttons
                              document.querySelectorAll('.play-button, .vjs-big-play-button, [class*="play"]').forEach(btn => {
                                  btn.click();
                              });
                          });
                      }
                  });
              }
          }
          
          // Run ad removal immediately and periodically
          removeAds();
          setInterval(removeAds, 1000);
          
          // Try to autoplay videos
          forceAutoplay();
          setInterval(forceAutoplay, 1000);
          
          // Set up a MutationObserver to catch newly added videos or iframes
          const observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                  if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                      for (let i = 0; i < mutation.addedNodes.length; i++) {
                          const node = mutation.addedNodes[i];
                          if (node.tagName === 'VIDEO' || node.tagName === 'IFRAME') {
                              console.log('New video/iframe detected. Trying to play...');
                              setTimeout(function() {
                                  if (node.tagName === 'VIDEO' && node.paused) {
                                      node.play().catch(e => console.log('Could not autoplay new video:', e));
                                  }
                              }, 1000);
                          }
                      }
                  }
              });
          });
          
          observer.observe(document.body, {
              childList: true,
              subtree: true
          });
          
          console.log('Ad blocking and autoplay enhancement active');
        })();
      `;
      
      // Inject the script
      iframeDoc.head.appendChild(script);
    } catch (error) {
      console.error("Error injecting script into iframe:", error);
    }
  };
  
  // Sandbox attribute intentionally omits 'allow-same-origin' to prevent cross-origin issues
  // We're using an iframe directly as React's sandbox limitations make it difficult to interact with the iframe content
  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      {isLoading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)', 
            zIndex: 10,
            flexDirection: 'column'
          }}
        >
          <CircularProgress size={60} sx={{ color: 'white' }} />
          <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
            Loading stream...
          </Typography>
        </Box>
      )}
      
      <iframe 
        ref={iframeRef}
        src={streamUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: isLoading ? 'none' : 'block'
        }}
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
      />
    </Box>
  );
};

export default VideoPlayer;