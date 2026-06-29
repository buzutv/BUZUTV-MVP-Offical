
// Helper function to convert YouTube URLs to embed format
export const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) {
    console.log('No URL provided to getYouTubeEmbedUrl');
    return null;
  }
  
  console.log('Processing YouTube URL:', url);
  
  // If it's already an embed URL, return it
  if (url.includes('youtube.com/embed/')) {
    console.log('URL is already an embed URL');
    return url.split('?')[0]; // Remove any existing query parameters
  }
  
  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    const videoId = match[2];
    console.log('Extracted video ID:', videoId);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    console.log('Generated embed URL:', embedUrl);
    return embedUrl;
  }
  
  console.log('Could not extract video ID from URL:', url);
  return null;
};
