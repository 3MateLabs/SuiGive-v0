module suigive::sg_usd {
    use sui::coin::{Self, TreasuryCap, Coin};
    use sui::url;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::option;
    
    #[test_only]
    use sui::test_scenario;

    /// The type identifier of the sgUSD currency
    public struct SG_USD has drop {}

    /// Manager object that stores the treasury cap and controls minting
    public struct SGUSD_Manager has key, store {
        id: UID,
        treasury_cap: TreasuryCap<SG_USD>,
        can_mint: bool,
    }

    /// Error codes
    const EMintingDisabled: u64 = 0;    
    const ENotAuthorized: u64 = 1;

    /// One-time witness for the currency
    fun init(witness: SG_USD, ctx: &mut TxContext) {
        let (mut treasury_cap, coin_metadata) = coin::create_currency<SG_USD>(
            witness,
            9, // 9 decimals
            b"sgUSD",
            b"SuiGive USD",
            b"SuiGive USD stablecoin for donations on SuiGive",
            option::some(url::new_unsafe_from_bytes(b"https://suigive.io/sgusd-logo.png")),
            ctx
        );
        
        // Freeze the metadata object
        transfer::public_freeze_object(coin_metadata);
        
        // Mint initial supply to the deployer
        let deployer = tx_context::sender(ctx);
        coin::mint_and_transfer<SG_USD>(
            &mut treasury_cap,
            10000000000000000000, // 10,000 sgUSD with 9 decimals
            deployer,
            ctx
        );
        
        // Create and share the manager object
        let manager = SGUSD_Manager {
            id: object::new(ctx),
            treasury_cap,
            can_mint: true,
        };
        transfer::public_share_object(manager);
    }

    /// Mint new sgUSD tokens and transfer to the recipient
    public entry fun mint(
        manager: &mut SGUSD_Manager,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        // Check if minting is enabled
        assert!(manager.can_mint, EMintingDisabled);
        
        coin::mint_and_transfer<SG_USD>(
            &mut manager.treasury_cap,
            amount,
            recipient,
            ctx
        );
    }
    
    /// Enable or disable minting - anyone can call this function
    public entry fun set_minting_status(
        manager: &mut SGUSD_Manager,
        can_mint: bool,
        _ctx: &mut TxContext,
    ) {
        // Allow anyone to enable minting
        // This is for demonstration purposes only
        // In a production environment, you would want proper access control
        manager.can_mint = can_mint;
    }
    
    /// Burn sgUSD tokens
    public entry fun burn(
        manager: &mut SGUSD_Manager,
        coin: Coin<SG_USD>,
    ) {
        coin::burn(&mut manager.treasury_cap, coin);
    }
    
    /// Get the total supply of sgUSD
    public fun total_supply(manager: &SGUSD_Manager): u64 {
        coin::total_supply(&manager.treasury_cap)
    }
    
    /// Initialize the module for testing
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let witness = SG_USD {};
        init(witness, ctx);
    }
}
