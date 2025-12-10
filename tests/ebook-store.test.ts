import { describe, it, expect, beforeEach } from "vitest";
import { Cl, ClarityValue } from "@stacks/transactions";

// Test accounts from Clarinet devnet
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const author1 = accounts.get("wallet_1")!;
const author2 = accounts.get("wallet_2")!;
const buyer1 = accounts.get("wallet_3")!;
const buyer2 = accounts.get("wallet_4")!;

// Contract name
const contractName = "ebook-store";

// Helper to create a mock IPFS content hash (32 bytes)
const createContentHash = (seed: number): Uint8Array => {
    const hash = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        hash[i] = (seed + i) % 256;
    }
    return hash;
};

// Error constants (must match contract)
const ERR_NOT_AUTHORIZED = 100;
const ERR_EBOOK_NOT_FOUND = 101;
const ERR_ALREADY_PURCHASED = 104;
const ERR_INVALID_PRICE = 105;
const ERR_INVALID_TITLE = 106;
const ERR_SELF_PURCHASE = 107;

describe("eBook Store Smart Contract Tests", () => {
    
    // ============================================================
    // EBOOK REGISTRATION TESTS
    // ============================================================
    
    describe("register-ebook", () => {
        
        it("should successfully register a new ebook", () => {
            const title = "My First eBook";
            const description = "A comprehensive guide to blockchain development";
            const contentHash = createContentHash(1);
            const price = 1000000n; // 1 STX
            
            const result = simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8(title),
                    Cl.stringUtf8(description),
                    Cl.buffer(contentHash),
                    Cl.uint(price)
                ],
                author1
            );
            
            expect(result.result).toBeOk(Cl.uint(1)); // First ebook ID is 1
            
            // Verify ebook was stored correctly
            const ebook = simnet.callReadOnlyFn(
                contractName,
                "get-ebook",
                [Cl.uint(1)],
                deployer
            );
            
            // Check that result is Some and contains expected fields
            expect(ebook.result).toBeSome(expect.anything());
        });
        
        it("should increment ebook counter for multiple registrations", () => {
            // Register first ebook
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("eBook 1"),
                    Cl.stringUtf8("Description 1"),
                    Cl.buffer(createContentHash(1)),
                    Cl.uint(1000000n)
                ],
                author1
            );
            
            // Register second ebook
            const result2 = simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("eBook 2"),
                    Cl.stringUtf8("Description 2"),
                    Cl.buffer(createContentHash(2)),
                    Cl.uint(2000000n)
                ],
                author2
            );
            
            expect(result2.result).toBeOk(Cl.uint(2));
            
            // Verify count
            const count = simnet.callReadOnlyFn(
                contractName,
                "get-ebook-count",
                [],
                deployer
            );
            
            expect(count.result).toEqual(Cl.uint(2));
        });
        
        it("should fail with empty title", () => {
            const result = simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8(""),
                    Cl.stringUtf8("Description"),
                    Cl.buffer(createContentHash(1)),
                    Cl.uint(1000000n)
                ],
                author1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_INVALID_TITLE));
        });
        
        it("should fail with zero price", () => {
            const result = simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Valid Title"),
                    Cl.stringUtf8("Description"),
                    Cl.buffer(createContentHash(1)),
                    Cl.uint(0)
                ],
                author1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_INVALID_PRICE));
        });
        
        it("should track author ebooks correctly", () => {
            // Register two ebooks by same author
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Author1 Book 1"),
                    Cl.stringUtf8("Desc"),
                    Cl.buffer(createContentHash(1)),
                    Cl.uint(1000000n)
                ],
                author1
            );
            
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Author1 Book 2"),
                    Cl.stringUtf8("Desc"),
                    Cl.buffer(createContentHash(2)),
                    Cl.uint(2000000n)
                ],
                author1
            );
            
            const authorBooks = simnet.callReadOnlyFn(
                contractName,
                "get-author-ebooks",
                [Cl.principal(author1)],
                deployer
            );
            
            expect(authorBooks.result).toEqual(Cl.list([Cl.uint(1), Cl.uint(2)]));
        });
    });
    
    // ============================================================
    // EBOOK LISTING TESTS
    // ============================================================
    
    describe("list-ebooks / get-ebook", () => {
        
        beforeEach(() => {
            // Register a test ebook
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Test eBook"),
                    Cl.stringUtf8("Test Description"),
                    Cl.buffer(createContentHash(99)),
                    Cl.uint(5000000n)
                ],
                author1
            );
        });
        
        it("should return ebook details by ID", () => {
            const ebook = simnet.callReadOnlyFn(
                contractName,
                "get-ebook",
                [Cl.uint(1)],
                deployer
            );
            
            expect(ebook.result).toBeSome(expect.anything());
        });
        
        it("should return none for non-existent ebook", () => {
            const ebook = simnet.callReadOnlyFn(
                contractName,
                "get-ebook",
                [Cl.uint(999)],
                deployer
            );
            
            expect(ebook.result).toBeNone();
        });
        
        it("should return correct ebook price", () => {
            const price = simnet.callReadOnlyFn(
                contractName,
                "get-ebook-price",
                [Cl.uint(1)],
                deployer
            );
            
            expect(price.result).toBeOk(Cl.uint(5000000n));
        });
        
        it("should return error for non-existent ebook price", () => {
            const price = simnet.callReadOnlyFn(
                contractName,
                "get-ebook-price",
                [Cl.uint(999)],
                deployer
            );
            
            expect(price.result).toBeErr(Cl.uint(ERR_EBOOK_NOT_FOUND));
        });
    });
    
    // ============================================================
    // PURCHASE FLOW TESTS
    // ============================================================
    
    describe("buy-ebook", () => {
        
        beforeEach(() => {
            // Register test ebook
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Purchasable eBook"),
                    Cl.stringUtf8("Buy me!"),
                    Cl.buffer(createContentHash(42)),
                    Cl.uint(1000000n) // 1 STX
                ],
                author1
            );
        });
        
        it("should successfully purchase an ebook", () => {
            const buyerBalanceBefore = simnet.getAssetsMap().get("STX")?.get(buyer1) || 0n;
            const authorBalanceBefore = simnet.getAssetsMap().get("STX")?.get(author1) || 0n;
            
            const result = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            expect(result.result).toBeOk(Cl.bool(true));
            
            // Verify STX transfer occurred
            const buyerBalanceAfter = simnet.getAssetsMap().get("STX")?.get(buyer1) || 0n;
            const authorBalanceAfter = simnet.getAssetsMap().get("STX")?.get(author1) || 0n;
            
            expect(buyerBalanceAfter).toBeLessThan(buyerBalanceBefore);
            expect(authorBalanceAfter).toBeGreaterThan(authorBalanceBefore);
        });
        
        it("should grant access after purchase", () => {
            // Purchase ebook
            simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            // Check access
            const hasAccess = simnet.callReadOnlyFn(
                contractName,
                "has-access",
                [Cl.principal(buyer1), Cl.uint(1)],
                deployer
            );
            
            expect(hasAccess.result).toEqual(Cl.bool(true));
        });
        
        it("should track buyer ebooks after purchase", () => {
            simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            const buyerBooks = simnet.callReadOnlyFn(
                contractName,
                "get-buyer-ebooks",
                [Cl.principal(buyer1)],
                deployer
            );
            
            expect(buyerBooks.result).toEqual(Cl.list([Cl.uint(1)]));
        });
        
        it("should fail when buying non-existent ebook", () => {
            const result = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(999)],
                buyer1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_EBOOK_NOT_FOUND));
        });
        
        it("should fail when author tries to buy own ebook", () => {
            const result = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                author1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_SELF_PURCHASE));
        });
        
        it("should fail when buying same ebook twice", () => {
            // First purchase
            simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            // Second purchase attempt
            const result = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_ALREADY_PURCHASED));
        });
        
        it("should allow multiple buyers to purchase same ebook", () => {
            const result1 = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            const result2 = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer2
            );
            
            expect(result1.result).toBeOk(Cl.bool(true));
            expect(result2.result).toBeOk(Cl.bool(true));
            
            // Both should have access
            const access1 = simnet.callReadOnlyFn(
                contractName,
                "has-access",
                [Cl.principal(buyer1), Cl.uint(1)],
                deployer
            );
            
            const access2 = simnet.callReadOnlyFn(
                contractName,
                "has-access",
                [Cl.principal(buyer2), Cl.uint(1)],
                deployer
            );
            
            expect(access1.result).toEqual(Cl.bool(true));
            expect(access2.result).toEqual(Cl.bool(true));
        });
    });
    
    // ============================================================
    // ACCESS CONTROL TESTS
    // ============================================================
    
    describe("has-access", () => {
        
        beforeEach(() => {
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Access Test eBook"),
                    Cl.stringUtf8("Testing access control"),
                    Cl.buffer(createContentHash(100)),
                    Cl.uint(500000n)
                ],
                author1
            );
        });
        
        it("should return false for non-purchaser", () => {
            const hasAccess = simnet.callReadOnlyFn(
                contractName,
                "has-access",
                [Cl.principal(buyer1), Cl.uint(1)],
                deployer
            );
            
            expect(hasAccess.result).toEqual(Cl.bool(false));
        });
        
        it("should return true for purchaser", () => {
            simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            const hasAccess = simnet.callReadOnlyFn(
                contractName,
                "has-access",
                [Cl.principal(buyer1), Cl.uint(1)],
                deployer
            );
            
            expect(hasAccess.result).toEqual(Cl.bool(true));
        });
        
        it("should return false for author (unless purchased)", () => {
            const hasAccess = simnet.callReadOnlyFn(
                contractName,
                "has-access",
                [Cl.principal(author1), Cl.uint(1)],
                deployer
            );
            
            // Author doesn't automatically have "purchased" access
            // They have author access checked via is-author
            expect(hasAccess.result).toEqual(Cl.bool(false));
        });
    });
    
    // ============================================================
    // PRICE UPDATE TESTS
    // ============================================================
    
    describe("update-price", () => {
        
        beforeEach(() => {
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Price Update Test"),
                    Cl.stringUtf8("Testing price updates"),
                    Cl.buffer(createContentHash(50)),
                    Cl.uint(1000000n)
                ],
                author1
            );
        });
        
        it("should allow author to update price", () => {
            const result = simnet.callPublicFn(
                contractName,
                "update-price",
                [Cl.uint(1), Cl.uint(2000000n)],
                author1
            );
            
            expect(result.result).toBeOk(Cl.bool(true));
            
            // Verify new price
            const price = simnet.callReadOnlyFn(
                contractName,
                "get-ebook-price",
                [Cl.uint(1)],
                deployer
            );
            
            expect(price.result).toBeOk(Cl.uint(2000000n));
        });
        
        it("should fail when non-author tries to update price", () => {
            const result = simnet.callPublicFn(
                contractName,
                "update-price",
                [Cl.uint(1), Cl.uint(2000000n)],
                buyer1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_NOT_AUTHORIZED));
        });
        
        it("should fail with zero price", () => {
            const result = simnet.callPublicFn(
                contractName,
                "update-price",
                [Cl.uint(1), Cl.uint(0)],
                author1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_INVALID_PRICE));
        });
    });
    
    // ============================================================
    // DEACTIVATION TESTS
    // ============================================================
    
    describe("deactivate-ebook / reactivate-ebook", () => {
        
        beforeEach(() => {
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Deactivation Test"),
                    Cl.stringUtf8("Testing deactivation"),
                    Cl.buffer(createContentHash(75)),
                    Cl.uint(1000000n)
                ],
                author1
            );
        });
        
        it("should allow author to deactivate ebook", () => {
            const result = simnet.callPublicFn(
                contractName,
                "deactivate-ebook",
                [Cl.uint(1)],
                author1
            );
            
            expect(result.result).toBeOk(Cl.bool(true));
        });
        
        it("should prevent purchase of deactivated ebook", () => {
            simnet.callPublicFn(
                contractName,
                "deactivate-ebook",
                [Cl.uint(1)],
                author1
            );
            
            const result = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_EBOOK_NOT_FOUND));
        });
        
        it("should allow author to reactivate ebook", () => {
            simnet.callPublicFn(
                contractName,
                "deactivate-ebook",
                [Cl.uint(1)],
                author1
            );
            
            const result = simnet.callPublicFn(
                contractName,
                "reactivate-ebook",
                [Cl.uint(1)],
                author1
            );
            
            expect(result.result).toBeOk(Cl.bool(true));
            
            // Verify can purchase again
            const buyResult = simnet.callPublicFn(
                contractName,
                "buy-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            expect(buyResult.result).toBeOk(Cl.bool(true));
        });
        
        it("should fail when non-author tries to deactivate", () => {
            const result = simnet.callPublicFn(
                contractName,
                "deactivate-ebook",
                [Cl.uint(1)],
                buyer1
            );
            
            expect(result.result).toBeErr(Cl.uint(ERR_NOT_AUTHORIZED));
        });
    });
    
    // ============================================================
    // IS-AUTHOR TESTS
    // ============================================================
    
    describe("is-author", () => {
        
        beforeEach(() => {
            simnet.callPublicFn(
                contractName,
                "register-ebook",
                [
                    Cl.stringUtf8("Author Check Test"),
                    Cl.stringUtf8("Testing author verification"),
                    Cl.buffer(createContentHash(200)),
                    Cl.uint(1000000n)
                ],
                author1
            );
        });
        
        it("should return true for actual author", () => {
            const result = simnet.callReadOnlyFn(
                contractName,
                "is-author",
                [Cl.uint(1), Cl.principal(author1)],
                deployer
            );
            
            expect(result.result).toEqual(Cl.bool(true));
        });
        
        it("should return false for non-author", () => {
            const result = simnet.callReadOnlyFn(
                contractName,
                "is-author",
                [Cl.uint(1), Cl.principal(buyer1)],
                deployer
            );
            
            expect(result.result).toEqual(Cl.bool(false));
        });
    });
});
