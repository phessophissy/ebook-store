/**
 * Custom Document for Next.js
 * Adds favicon, meta tags, and mobile viewport
 */

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        
        {/* Mobile viewport - prevent zoom on input focus */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        
        {/* Theme and PWA */}
        <meta name="theme-color" content="#5546FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* SEO */}
        <meta name="description" content="Decentralized eBook marketplace on Bitcoin L2 (Stacks). Buy and sell ebooks with STX." />
        <meta name="keywords" content="ebook, marketplace, bitcoin, stacks, blockchain, decentralized" />
        
        {/* Open Graph */}
        <meta property="og:title" content="eBook Store - Bitcoin L2 Marketplace" />
        <meta property="og:description" content="Decentralized eBook marketplace on Bitcoin L2" />
        <meta property="og:type" content="website" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
