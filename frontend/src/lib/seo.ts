// SEO utility functions

export interface SEOMetrics {
  title: string;
  description: string;
  keywords: string;
  url: string;
  loadTime?: number;
  wordCount?: number;
  headingCount?: number;
  imageCount?: number;
  linkCount?: number;
}

export function analyzePageSEO(): SEOMetrics {
  const startTime = performance.now();
  
  // Basic SEO metrics
  const title = document.title || '';
  const description = (document.querySelector('meta[name="description"]') as HTMLMetaElement)?.content || '';
  const keywords = (document.querySelector('meta[name="keywords"]') as HTMLMetaElement)?.content || '';
  const url = window.location.href;
  
  // Content analysis
  const bodyText = document.body.innerText || '';
  const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
  const headingCount = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
  const imageCount = document.querySelectorAll('img').length;
  const linkCount = document.querySelectorAll('a').length;
  
  const loadTime = performance.now() - startTime;
  
  return {
    title,
    description,
    keywords,
    url,
    loadTime,
    wordCount,
    headingCount,
    imageCount,
    linkCount
  };
}

export function validateSEO(metrics: SEOMetrics): string[] {
  const issues: string[] = [];
  
  // Title validation
  if (!metrics.title) {
    issues.push('Missing page title');
  } else if (metrics.title.length < 30) {
    issues.push('Title is too short (should be 30-60 characters)');
  } else if (metrics.title.length > 60) {
    issues.push('Title is too long (should be 30-60 characters)');
  }
  
  // Description validation
  if (!metrics.description) {
    issues.push('Missing meta description');
  } else if (metrics.description.length < 120) {
    issues.push('Description is too short (should be 120-160 characters)');
  } else if (metrics.description.length > 160) {
    issues.push('Description is too long (should be 120-160 characters)');
  }
  
  // Content validation
  if ((metrics.wordCount || 0) < 300) {
    issues.push('Page content is too short (should be at least 300 words)');
  }
  
  if ((metrics.headingCount || 0) < 1) {
    issues.push('No headings found on page');
  }
  
  if (metrics.imageCount === 0) {
    issues.push('No images found on page');
  }
  
  return issues;
}

export function generateSEOReport(): void {
  const metrics = analyzePageSEO();
  const issues = validateSEO(metrics);
  
  console.group('🔍 SEO Analysis Report');
  console.log('📊 Metrics:', metrics);
  
  if (issues.length === 0) {
    console.log('✅ No SEO issues found!');
  } else {
    console.log('⚠️ SEO Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.groupEnd();
} 