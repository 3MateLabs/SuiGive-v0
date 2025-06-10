// SuiGive Donation Token Module
// Implements transferable donation receipts
module suigive::donation_token {
    // These modules are already provided by default
    // use sui::object;
    use sui::coin::{Self, Coin, TreasuryCap};
    // use sui::transfer;
    // use sui::tx_context;
    use sui::event;
    
    /// A capability that allows the holder to mint DonationTokens
    public struct DonationTokenMinterCap has key {
        id: UID,
    }
    
    /// The DonationToken type - represents a transferable receipt of donation
    public struct DONATION_TOKEN has drop {}
    
    /// Event emitted when a donation token is minted
    public struct DonationTokenMinted has copy, drop {
        campaign_id: address,
        donor: address,
        amount: u64,
        token_id: address,
    }
    
    /// Event emitted when a donation token is transferred
    public struct DonationTokenTransferred has copy, drop {
        token_id: address,
        from: address,
        to: address,
    }
    
    /// Initialize the module
    fun init(otw: DONATION_TOKEN, ctx: &mut TxContext) {
        // Create and transfer the minter capability to the module deployer
        let minter_cap = DonationTokenMinterCap {
            id: object::new(ctx),
        };
        transfer::transfer(minter_cap, tx_context::sender(ctx));
        
        // Create the donation token type
        let (treasury_cap, metadata) = coin::create_currency(
            otw,
            9, // 9 decimals like SUI
            b"SGDT", // Symbol
            b"SuiGive Donation Token", // Name
            b"Transferable proof of donation on SuiGive", // Description
            option::none(), // Icon URL
            ctx
        );
        
        // Transfer the treasury cap to the module deployer
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_transfer(metadata, tx_context::sender(ctx));
    }
    
    /// Mint a donation token for a donor
    public fun mint_donation_token(
        treasury_cap: &mut TreasuryCap<DONATION_TOKEN>,
        campaign_id: address,
        donor: address,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<DONATION_TOKEN> {
        // Mint the token with the donation amount
        let token = coin::mint(treasury_cap, amount, ctx);
        let token_id = object::id_address(&token);
        
        // Emit event
        event::emit(DonationTokenMinted {
            campaign_id,
            donor,
            amount,
            token_id,
        });
        
        token
    }
    
    #[test_only]
    /// Initialize function for testing
    public fun init_for_testing(ctx: &mut TxContext) {
        init(DONATION_TOKEN {}, ctx)
    }
    
    /// Get the metadata for a donation token
    public fun get_token_info(token: &Coin<DONATION_TOKEN>): (u64) {
        (coin::value(token))
    }
    
    /// Allow anyone to transfer their donation token
    public entry fun transfer_donation_token(
        token: Coin<DONATION_TOKEN>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let token_id = object::id_address(&token);
        let sender = tx_context::sender(ctx);
        
        // Emit transfer event
        event::emit(DonationTokenTransferred {
            token_id,
            from: sender,
            to: recipient,
        });
        
        // Transfer the token
        transfer::public_transfer(token, recipient);
    }
    
    /// Split a donation token
    public entry fun split_donation_token(
        token: &mut Coin<DONATION_TOKEN>,
        split_amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let split_token = coin::split(token, split_amount, ctx);
        transfer::public_transfer(split_token, recipient);
    }
    
    /// Merge donation tokens
    public entry fun merge_donation_tokens(
        token: &mut Coin<DONATION_TOKEN>,
        token_to_merge: Coin<DONATION_TOKEN>
    ) {
        coin::join(token, token_to_merge);
    }
}
