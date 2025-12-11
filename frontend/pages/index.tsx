/**
 * Homepage - Ebook marketplace listing
 */

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import EbookCard from "../components/EbookCard";
import { getAllEbooks, Ebook } from "../services/stacks";

export default function Home() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEbooks();
  }, []);

  const loadEbooks = async () => {
    try {
      setIsLoading(true);
      const data = await getAllEbooks();
      setEbooks(data);
    } catch (err) {
      console.error("Failed to load ebooks:", err);
      setError("Failed to load ebooks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero Section - Mobile optimized */}
      <div className="text-center mb-8 sm:mb-12 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
          Decentralized eBook Marketplace
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          Buy and sell ebooks directly on Bitcoin L2. Authors retain full
          ownership, and all transactions are secured by the Stacks blockchain.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8 sm:py-12">
          <div className="spinner" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-red-400 mb-4 text-sm sm:text-base">{error}</p>
          <button onClick={loadEbooks} className="btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && ebooks.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-white/5 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
            No ebooks yet
          </h3>
          <p className="text-white/60 mb-4 sm:mb-6 text-sm sm:text-base">
            Be the first to publish an ebook on the marketplace!
          </p>
          <a href="/upload" className="btn-primary inline-block">
            Publish Your eBook
          </a>
        </div>
      )}

      {/* Ebook Grid - Responsive */}
      {!isLoading && !error && ebooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {ebooks.map((ebook) => (
            <EbookCard key={ebook.id} ebook={ebook} />
          ))}
        </div>
      )}
    </Layout>
  );
}
