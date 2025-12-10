/**
 * Upload page - Author ebook registration
 */

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  registerEbook,
  stxToMicroStx,
  isSignedIn,
  getUserAddress,
} from "../services/stacks";

export default function Upload() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [ipfsCid, setIpfsCid] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate wallet connection
    if (!isSignedIn()) {
      setError("Please connect your wallet first.");
      return;
    }

    // Validate form
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }
    if (!ipfsCid.trim()) {
      setError("IPFS CID is required. Upload your ebook to IPFS first.");
      return;
    }

    try {
      setIsLoading(true);

      // Convert IPFS CID to 32-byte hash
      const encoder = new TextEncoder();
      const data = encoder.encode(ipfsCid);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const contentHash = new Uint8Array(hashBuffer);

      // Convert price to microSTX
      const priceInMicroStx = stxToMicroStx(parseFloat(price));

      // Call contract
      await registerEbook(
        title,
        description,
        contentHash,
        priceInMicroStx,
        () => {
          // Success - redirect to home
          router.push("/");
        },
        () => {
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Failed to register ebook. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Publish Your eBook</h1>
        <p className="text-white/60 mb-8">
          Register your ebook on the blockchain. Once published, buyers can
          purchase directly through the smart contract.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ebook title"
              className="input"
              maxLength={64}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your ebook"
              className="input min-h-[120px] resize-none"
              maxLength={256}
              disabled={isLoading}
            />
            <p className="text-xs text-white/40 mt-1">
              {description.length}/256 characters
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Price (STX)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="input"
              step="0.000001"
              min="0.000001"
              disabled={isLoading}
            />
          </div>

          {/* IPFS CID */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              IPFS Content ID (CID)
            </label>
            <input
              type="text"
              value={ipfsCid}
              onChange={(e) => setIpfsCid(e.target.value)}
              placeholder="Qm... or bafy..."
              className="input"
              disabled={isLoading}
            />
            <p className="text-xs text-white/40 mt-1">
              Upload your encrypted ebook to IPFS first, then paste the CID here.
            </p>
          </div>

          {/* File Upload (optional, for reference) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              eBook File (for preview only)
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-stacks-purple/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.epub"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="text-white">{file.name}</p>
                    <p className="text-sm text-white/40">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="w-12 h-12 mx-auto text-white/40 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-white/60">
                      Click to select PDF or EPUB file
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="spinner w-5 h-5" />
                Publishing...
              </>
            ) : (
              "Publish eBook"
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
