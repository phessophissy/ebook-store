/**
 * Ebook detail page with purchase functionality
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import {
  getEbook,
  hasAccess,
  isAuthor,
  buyEbook,
  formatStx,
  isSignedIn,
  getUserAddress,
  Ebook,
} from "../../services/stacks";

export default function EbookDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [userHasAccess, setUserHasAccess] = useState(false);
  const [userIsAuthor, setUserIsAuthor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEbook();
    }
  }, [id]);

  const loadEbook = async () => {
    try {
      setIsLoading(true);
      const ebookId = parseInt(id as string);
      const data = await getEbook(ebookId);
      
      if (!data) {
        setError("Ebook not found");
        return;
      }
      
      setEbook({
        id: ebookId,
        title: data.title,
        description: data.description,
        contentHash: data["content-hash"],
        price: Number(data.price),
        author: data.author,
        createdAt: Number(data["created-at"]),
        active: data.active,
      });

      // Check access if user is signed in
      const userAddress = getUserAddress();
      if (userAddress) {
        const [access, isAuth] = await Promise.all([
          hasAccess(userAddress, ebookId),
          isAuthor(ebookId, userAddress),
        ]);
        setUserHasAccess(access);
        setUserIsAuthor(isAuth);
      }
    } catch (err) {
      console.error("Failed to load ebook:", err);
      setError("Failed to load ebook details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isSignedIn()) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsPurchasing(true);
      setError(null);
      
      await buyEbook(
        parseInt(id as string),
        () => {
          // Success - reload to update access status
          loadEbook();
          setIsPurchasing(false);
        },
        () => {
          setIsPurchasing(false);
        }
      );
    } catch (err) {
      console.error("Purchase failed:", err);
      setError("Purchase failed. Please try again.");
      setIsPurchasing(false);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (error && !ebook) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => router.back()} className="btn-secondary">
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  if (!ebook) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-white/60">Ebook not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Book Cover Placeholder */}
          <div className="aspect-[3/4] bg-gradient-to-br from-stacks-purple/20 to-stacks-purple/5 rounded-2xl flex items-center justify-center">
            <svg
              className="w-32 h-32 text-stacks-purple/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          {/* Book Details */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-4">{ebook.title}</h1>
            
            <div className="text-sm text-white/40 mb-4">
              by {truncateAddress(ebook.author)}
              {userIsAuthor && (
                <span className="ml-2 px-2 py-1 bg-stacks-purple/20 text-stacks-purple rounded text-xs">
                  You are the author
                </span>
              )}
            </div>

            <p className="text-white/70 mb-6">{ebook.description}</p>

            <div className="card mb-6">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Price</span>
                <span className="text-2xl font-bold text-stacks-purple">
                  {formatStx(ebook.price)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {userHasAccess || userIsAuthor ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">
                    {userIsAuthor
                      ? "You are the author of this ebook"
                      : "You own this ebook"}
                  </p>
                </div>
                <a
                  href={`/download/${ebook.id}`}
                  className="btn-primary w-full block text-center"
                >
                  Download eBook
                </a>
              </div>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || !ebook.active}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isPurchasing ? (
                  <>
                    <div className="spinner w-5 h-5" />
                    Processing...
                  </>
                ) : !ebook.active ? (
                  "Not Available"
                ) : (
                  `Buy for ${formatStx(ebook.price)}`
                )}
              </button>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-8 space-y-2 text-sm text-white/40">
              <div className="flex justify-between">
                <span>Ebook ID</span>
                <span>#{ebook.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Content Hash</span>
                <span className="truncate max-w-[200px]">
                  {ebook.contentHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={ebook.active ? "text-green-400" : "text-red-400"}>
                  {ebook.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
