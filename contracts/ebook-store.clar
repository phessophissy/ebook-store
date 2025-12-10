;; ============================================================
;; eBook Store - Bitcoin L2 Marketplace Smart Contract
;; ============================================================
;; A decentralized ebook marketplace on Stacks (Bitcoin L2)
;; Authors register and sell ebooks, buyers purchase to unlock access
;; All business logic governed on-chain using Clarity 4
;; ============================================================

;; ============================================================
;; CONSTANTS
;; ============================================================

;; Contract owner (deployer)
(define-constant CONTRACT-OWNER tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-EBOOK-NOT-FOUND (err u101))
(define-constant ERR-EBOOK-EXISTS (err u102))
(define-constant ERR-INSUFFICIENT-FUNDS (err u103))
(define-constant ERR-ALREADY-PURCHASED (err u104))
(define-constant ERR-INVALID-PRICE (err u105))
(define-constant ERR-INVALID-TITLE (err u106))
(define-constant ERR-SELF-PURCHASE (err u107))
(define-constant ERR-TRANSFER-FAILED (err u108))

;; ============================================================
;; DATA VARIABLES
;; ============================================================

;; Counter for ebook IDs (auto-increment)
(define-data-var ebook-counter uint u0)

;; ============================================================
;; DATA MAPS
;; ============================================================

;; Registry: ebook-id -> ebook metadata
(define-map ebooks
    uint
    {
        title: (string-utf8 64),
        description: (string-utf8 256),
        content-hash: (buff 32),
        price: uint,
        author: principal,
        created-at: uint,
        active: bool
    }
)

;; Ownership: maps (ebook-id, buyer) -> purchase record
(define-map purchases
    { ebook-id: uint, buyer: principal }
    {
        purchased-at: uint,
        price-paid: uint
    }
)

;; Author index: maps author -> list of ebook IDs they created
(define-map author-ebooks
    principal
    (list 100 uint)
)

;; Buyer index: maps buyer -> list of ebook IDs they own
(define-map buyer-ebooks
    principal
    (list 100 uint)
)

;; ============================================================
;; PRIVATE FUNCTIONS
;; ============================================================

;; Check if an ebook exists
(define-private (ebook-exists (ebook-id uint))
    (is-some (map-get? ebooks ebook-id))
)

;; Get current block timestamp using Clarity 4 stacks-block-time
(define-private (get-current-time)
    stacks-block-time
)

;; ============================================================
;; READ-ONLY FUNCTIONS
;; ============================================================

;; Get ebook by ID
(define-read-only (get-ebook (ebook-id uint))
    (map-get? ebooks ebook-id)
)

;; Check if a buyer has access to an ebook
(define-read-only (has-access (buyer principal) (ebook-id uint))
    (is-some (map-get? purchases { ebook-id: ebook-id, buyer: buyer }))
)

;; Get purchase details for a buyer and ebook
(define-read-only (get-purchase (buyer principal) (ebook-id uint))
    (map-get? purchases { ebook-id: ebook-id, buyer: buyer })
)

;; Get total number of ebooks registered
(define-read-only (get-ebook-count)
    (var-get ebook-counter)
)

;; Get all ebook IDs by an author
(define-read-only (get-author-ebooks (author principal))
    (default-to (list) (map-get? author-ebooks author))
)

;; Get all ebook IDs owned by a buyer
(define-read-only (get-buyer-ebooks (buyer principal))
    (default-to (list) (map-get? buyer-ebooks buyer))
)

;; Check if sender is the author of an ebook
(define-read-only (is-author (ebook-id uint) (user principal))
    (match (map-get? ebooks ebook-id)
        ebook (is-eq (get author ebook) user)
        false
    )
)

;; Get ebook price
(define-read-only (get-ebook-price (ebook-id uint))
    (match (map-get? ebooks ebook-id)
        ebook (ok (get price ebook))
        ERR-EBOOK-NOT-FOUND
    )
)

;; ============================================================
;; PUBLIC FUNCTIONS
;; ============================================================

;; Register a new ebook
;; @param title - Ebook title (max 64 UTF-8 chars)
;; @param description - Ebook description (max 256 UTF-8 chars)
;; @param content-hash - IPFS CID hash of encrypted content (32 bytes)
;; @param price - Price in microSTX (1 STX = 1,000,000 microSTX)
(define-public (register-ebook 
    (title (string-utf8 64))
    (description (string-utf8 256))
    (content-hash (buff 32))
    (price uint))
    (let
        (
            (new-ebook-id (+ (var-get ebook-counter) u1))
            (author tx-sender)
            (current-author-ebooks (default-to (list) (map-get? author-ebooks tx-sender)))
        )
        ;; Validate title is not empty
        (asserts! (> (len title) u0) ERR-INVALID-TITLE)
        ;; Validate price is greater than 0
        (asserts! (> price u0) ERR-INVALID-PRICE)
        
        ;; Store ebook metadata
        (map-set ebooks new-ebook-id {
            title: title,
            description: description,
            content-hash: content-hash,
            price: price,
            author: author,
            created-at: (get-current-time),
            active: true
        })
        
        ;; Update author's ebook list
        (map-set author-ebooks author 
            (unwrap! (as-max-len? (append current-author-ebooks new-ebook-id) u100) ERR-NOT-AUTHORIZED))
        
        ;; Increment counter
        (var-set ebook-counter new-ebook-id)
        
        ;; Emit event using print
        (print {
            event: "ebook-registered",
            ebook-id: new-ebook-id,
            title: title,
            author: author,
            price: price,
            content-hash: content-hash,
            timestamp: (get-current-time)
        })
        
        (ok new-ebook-id)
    )
)

;; Purchase an ebook
;; @param ebook-id - ID of the ebook to purchase
;; Transfers STX from buyer to author and grants access
(define-public (buy-ebook (ebook-id uint))
    (let
        (
            (buyer tx-sender)
            (ebook (unwrap! (map-get? ebooks ebook-id) ERR-EBOOK-NOT-FOUND))
            (price (get price ebook))
            (author (get author ebook))
            (current-buyer-ebooks (default-to (list) (map-get? buyer-ebooks buyer)))
        )
        ;; Validate ebook is active
        (asserts! (get active ebook) ERR-EBOOK-NOT-FOUND)
        ;; Prevent self-purchase
        (asserts! (not (is-eq buyer author)) ERR-SELF-PURCHASE)
        ;; Prevent duplicate purchase
        (asserts! (not (has-access buyer ebook-id)) ERR-ALREADY-PURCHASED)
        
        ;; Transfer payment from buyer to author
        (unwrap! (stx-transfer? price buyer author) ERR-TRANSFER-FAILED)
        
        ;; Record purchase
        (map-set purchases { ebook-id: ebook-id, buyer: buyer } {
            purchased-at: (get-current-time),
            price-paid: price
        })
        
        ;; Update buyer's ebook list
        (map-set buyer-ebooks buyer 
            (unwrap! (as-max-len? (append current-buyer-ebooks ebook-id) u100) ERR-NOT-AUTHORIZED))
        
        ;; Emit purchase event
        (print {
            event: "ebook-purchased",
            ebook-id: ebook-id,
            buyer: buyer,
            author: author,
            price: price,
            timestamp: (get-current-time)
        })
        
        (ok true)
    )
)

;; Update ebook price (author only)
;; @param ebook-id - ID of the ebook to update
;; @param new-price - New price in microSTX
(define-public (update-price (ebook-id uint) (new-price uint))
    (let
        (
            (ebook (unwrap! (map-get? ebooks ebook-id) ERR-EBOOK-NOT-FOUND))
        )
        ;; Only author can update
        (asserts! (is-eq (get author ebook) tx-sender) ERR-NOT-AUTHORIZED)
        ;; Validate new price
        (asserts! (> new-price u0) ERR-INVALID-PRICE)
        
        ;; Update ebook with new price
        (map-set ebooks ebook-id (merge ebook { price: new-price }))
        
        ;; Emit event
        (print {
            event: "price-updated",
            ebook-id: ebook-id,
            old-price: (get price ebook),
            new-price: new-price,
            timestamp: (get-current-time)
        })
        
        (ok true)
    )
)

;; Deactivate an ebook (author only)
;; @param ebook-id - ID of the ebook to deactivate
(define-public (deactivate-ebook (ebook-id uint))
    (let
        (
            (ebook (unwrap! (map-get? ebooks ebook-id) ERR-EBOOK-NOT-FOUND))
        )
        ;; Only author can deactivate
        (asserts! (is-eq (get author ebook) tx-sender) ERR-NOT-AUTHORIZED)
        
        ;; Update ebook to inactive
        (map-set ebooks ebook-id (merge ebook { active: false }))
        
        ;; Emit event
        (print {
            event: "ebook-deactivated",
            ebook-id: ebook-id,
            author: tx-sender,
            timestamp: (get-current-time)
        })
        
        (ok true)
    )
)

;; Reactivate an ebook (author only)
;; @param ebook-id - ID of the ebook to reactivate
(define-public (reactivate-ebook (ebook-id uint))
    (let
        (
            (ebook (unwrap! (map-get? ebooks ebook-id) ERR-EBOOK-NOT-FOUND))
        )
        ;; Only author can reactivate
        (asserts! (is-eq (get author ebook) tx-sender) ERR-NOT-AUTHORIZED)
        
        ;; Update ebook to active
        (map-set ebooks ebook-id (merge ebook { active: true }))
        
        ;; Emit event
        (print {
            event: "ebook-reactivated",
            ebook-id: ebook-id,
            author: tx-sender,
            timestamp: (get-current-time)
        })
        
        (ok true)
    )
)
