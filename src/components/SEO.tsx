import { useEffect } from "react";

type SEOProps = {
  title: string;
  description?: string;
  canonical?: string;
  jsonLd?: object;
};

export const SEO = ({ title, description, canonical = "/", jsonLd }: SEOProps) => {
  useEffect(() => {
    // Enforce consistent branding in the tab title
    const siteTitle = "Orderly - B2B";
    document.title = siteTitle;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    (link as HTMLLinkElement).href = canonical;

    if (jsonLd) {
      const existing = document.getElementById('ld-json');
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.id = 'ld-json';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, jsonLd]);

  return null;
};
