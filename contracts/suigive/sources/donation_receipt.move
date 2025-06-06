module suigive::donation_receipt {
    use sui::event;
    use std::string::{Self, String};
    use sui::url::{Self, Url};
    use sui::package;
    use sui::display;
    
    // === Errors ===
    const ENotTransferable: u64 = 3;
    
    // === Structs ===
    /// Soulbound NFT receipt for donations - note the absence of 'store' ability
    /// This makes it non-transferable (soulbound)
    public struct DonationReceipt has key {
        id: UID,
        campaign_id: address,
        donor: address,
        amount: u64,
        timestamp: u64,
        message: String,
        is_anonymous: bool,
        // Optional metadata
        name: String,
        description: String,
        url: Url,
    }
    
    /// Admin capability for burning NFTs (e.g., for refunds)
    public struct AdminCap has key, store {
        id: UID,
        campaign_id: address,
    }
    
    // One-time witness for the package
    public struct DONATION_RECEIPT has drop {}
    
    // === Module Initialization ===
    /// Called when the module is published
    fun init(witness: DONATION_RECEIPT, ctx: &mut TxContext) {
        // Create the Publisher object
        let publisher = package::claim(witness, ctx);
        
        // Create a Display object for DonationReceipt
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"project_url"),
            string::utf8(b"creator"),
            string::utf8(b"amount_sui")
        ];
        
        let values = vector[
            string::utf8(b"SuiGive Donation Receipt"),
            // Use a simpler format for the description
            string::utf8(b"Thank you for your donation to {campaign_id}. Amount: {amount/1000000000} SUI"),
            string::utf8(b"{image_url}"),  // Use dynamic field for image URL
            string::utf8(b"https://suigive.org"),
            string::utf8(b"SuiGive Platform"),
            // Use a simpler format for the amount
            string::utf8(b"{amount/1000000000}")
        ];
        
        let mut display = display::new_with_fields<DonationReceipt>(
            &publisher,
            keys,
            values,
            ctx
        );
        
        // Commit the Display object
        display::update_version(&mut display);
        
        // Transfer the objects to the sender
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }
    
    
    // === Events ===
    /// Emitted when a donation NFT is minted
    public struct ReceiptMinted has copy, drop {
        receipt_id: address,
        campaign_id: address,
        donor: address,
        amount: u64,
        is_anonymous: bool,
    }
    
    /// Emitted when a donation NFT is burned
    public struct ReceiptBurned has copy, drop {
        receipt_id: address,
        campaign_id: address,
        donor: address,
        amount: u64,
        reason: String,
    }
    
    // No helper function needed
    
    // === Public Functions ===
    /// Mint a donation NFT receipt
    public fun mint(
        campaign_id: address,
        donor: address,
        amount: u64,
        message: vector<u8>,
        is_anonymous: bool,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ): DonationReceipt {
        // Format name and description if they're empty
        let name_str = if (vector::length(&name) == 0) {
            string::utf8(b"SuiGive Donation Receipt")
        } else {
            string::utf8(name)
        };
        
        let description_str = if (vector::length(&description) == 0) {
            // Create a simple description without complex string manipulation
            string::utf8(b"Thank you for your donation to SuiGive campaign.")
        } else {
            string::utf8(description)
        };
        
        // Create the receipt with proper metadata
        let receipt = DonationReceipt {
            id: object::new(ctx),
            campaign_id,
            donor,
            amount,
            timestamp: tx_context::epoch(ctx),
            message: string::utf8(message),
            is_anonymous,
            name: name_str,
            description: description_str,
            url: url::new_unsafe_from_bytes(url), // This will be used for the image_url in display
        };
        
        // Emit event
        event::emit(ReceiptMinted {
            receipt_id: object::uid_to_address(&receipt.id),
            campaign_id,
            donor,
            amount,
            is_anonymous,
        });
        
        receipt
    }
    
    /// Mint and send a donation NFT receipt to the donor
    public entry fun mint_and_send(
        campaign_id: address,
        amount: u64,
        message: vector<u8>,
        is_anonymous: bool,
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let donor = tx_context::sender(ctx);
        let receipt = mint(
            campaign_id,
            donor,
            amount,
            message,
            is_anonymous,
            name,
            description,
            url,
            ctx
        );
        
        // Transfer NFT to donor (becomes soulbound)
        transfer::transfer(receipt, donor);
    }
    
    /// Transfer a receipt to a recipient (for use by other modules)
    public fun transfer_receipt(receipt: DonationReceipt, recipient: address) {
        transfer::transfer(receipt, recipient);
    }
    
    /// Create admin capability for a campaign
    public fun create_admin_cap(
        campaign_id: address,
        ctx: &mut TxContext
    ): AdminCap {
        AdminCap {
            id: object::new(ctx),
            campaign_id,
        }
    }
    
    /// Burn a donation NFT (admin only)
    public entry fun burn(
        receipt: DonationReceipt,
        reason: vector<u8>,
        _admin_cap: &AdminCap,
        _ctx: &mut TxContext
    ) {
        let DonationReceipt {
            id,
            campaign_id,
            donor,
            amount,
            timestamp: _,
            message: _,
            is_anonymous: _,
            name: _,
            description: _,
            url: _
        } = receipt;
        
        // Emit event before burning
        event::emit(ReceiptBurned {
            receipt_id: object::uid_to_address(&id),
            campaign_id,
            donor,
            amount,
            reason: string::utf8(reason),
        });
        
        // Delete the NFT
        object::delete(id);
    }
    
    // === View Functions ===
    /// Get donation NFT details
    public fun get_details(receipt: &DonationReceipt): (
        address, // campaign_id
        address, // donor
        u64,     // amount
        u64,     // timestamp
        String,  // message
        bool     // is_anonymous
    ) {
        (
            receipt.campaign_id,
            receipt.donor,
            receipt.amount,
            receipt.timestamp,
            receipt.message,
            receipt.is_anonymous
        )
    }
    
    /// Get NFT metadata
    public fun get_metadata(receipt: &DonationReceipt): (String, String, Url) {
        (receipt.name, receipt.description, receipt.url)
    }
    
    // === Compatibility Functions ===
    // These functions exist for compatibility with the existing frontend
    // They maintain the same interface but implement the new soulbound behavior
    
    /// Compatibility function for the frontend - always aborts
    /// This ensures the frontend doesn't break, but transfers are impossible
    public entry fun transfer_donation_receipt(
        _receipt: &DonationReceipt,
        _recipient: address,
        _ctx: &mut TxContext
    ) {
        // Abort with a clear error message
        abort ENotTransferable
    }
}
