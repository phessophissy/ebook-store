/**
 * Download page - Gated DRM download for purchased ebooks
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import {
  getEbook,
  hasAccess,
  isAuthor,
  isSignedIn,
  getUserAddress,
  Ebook,
} from "../../services/stacks";

export default function Download() {
  const router = useRouter();
  const { id } = router.query;

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [userHasAccess, setUserHasAccess] = useState(false);
  const [userIsAuthor, setUserIsAuthor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      checkAccess();
    }
  }, [id]);

  const checkAccess = async () => {
    try {
      setIsLoading(true);

      // Check if user is signed in
      if (!isSignedIn()) {
        setError("Please connect your wallet to access this content");
        return;
      }

      const userAddress = getUserAddress();
      if (!userAddress) {
        setError("Could not get wallet address");
        return;
      }

      const ebookId = parseInt(id as string);

      // Fetch ebook data
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

      // Check access
      const [access, isAuth] = await Promise.all([
        hasAccess(userAddress, ebookId),
        isAuthor(ebookId, userAddress),
      ]);

      setUserHasAccess(access);
      setUserIsAuthor(isAuth);

      if (!access && !isAuth) {
        setError("You do not have access to this content. Please purchase the ebook first.");
      }
    } catch (err) {
      console.error("Access check failed:", err);
      setError("Failed to verify access");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!ebook) return;

    try {
      setIsDownloading(true);
      const userAddress = getUserAddress();

      // In production, this would:
      // 1. Call server API with wallet signature to get decryption key
      // 2. Fetch encrypted file from IPFS using content hash
      // 3. Decrypt file locally
      // 4. Add wallet watermark to PDF
      // 5. Trigger download

      // For now, show placeholder message
      alert(
        `Download initiated for "${ebook.title}"\n\n` +
        `Content Hash: ${ebook.contentHash}\n` +
        `Buyer: ${userAddress}\n\n` +
        `In production:\n` +
        `1. Server verifies on-chain access\n` +
        `2. Server generates decryption key\n` +
        `3. Client fetches encrypted file from IPFS\n` +
        `4. Client decrypts and watermarks PDF\n` +
        `5. Download starts automatically`
      );
    } catch (err) {
      console.error("Download failed:", err);
      setError("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="spinner mb-4" />
          <p className="text-white/60">Verifying access...</p>
        </div>
      </Layout>
    );
  }

  // Access denied
  if (error || (!userHasAccess && !userIsAuthor)) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/60 mb-6">
            {error || "You need to purchase this ebook to download it."}
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => router.back()} className="btn-secondary">
              Go Back
            </button>
            {id && (
              <a href={`/ebook/${id}`} className="btn-primary">
                Purchase eBook
              </a>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Access granted
  return (
    <Layout>
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {ebook?.title}
        </h2>
        <p className="text-white/40 mb-6">
          {userIsAuthor ? "You are the author" : "Purchase verified"}
        </p>

        <div className="card mb-6 text-left">
          <h3 className="text-sm font-medium text-white/60 mb-4">
            Download Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">File Format</span>
              <span className="text-white">PDF (Watermarked)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">DRM Protection</span>
              <span className="text-green-400">Wallet Watermark</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Content Hash</span>
              <span className="text-white truncate max-w-[150px]">
                {ebook?.contentHash}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isDownloading ? (
            <>
              <div className="spinner w-5 h-5" />
              Preparing Download...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download eBook
            </>
          )}
        </button>

        <p className="text-xs text-white/40 mt-4">
          Your wallet address will be embedded as a watermark on every page.
        </p>
      </div>
    </Layout>
  );
}
