#[test_only]
module suigive::sg_usd_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self};
    use sui::test_utils::assert_eq;
    use suigive::sg_usd::{Self, SGUSD_Manager, SG_USD};
    
    // Test addresses
    const ADMIN: address = @0xAD;
    const USER: address = @0xB1;
    
    // Test constants
    const MINT_AMOUNT: u64 = 1000000000; // 1 sgUSD with 9 decimals
    
    #[test]
    fun test_sg_usd_mint_and_burn() {
        // Set up the test scenario
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the sgUSD module
        init_module(&mut scenario);
        
        // Mint sgUSD tokens
        mint_sg_usd(&mut scenario);
        
        // Burn sgUSD tokens
        burn_sg_usd(&mut scenario);
        
        // Clean up
        ts::end(scenario);
    }
    
    fun init_module(scenario: &mut Scenario) {
        // Initialize the sgUSD module
        ts::next_tx(scenario, ADMIN);
        {
            sg_usd::init_for_testing(ts::ctx(scenario));
        };
    }
    
    fun mint_sg_usd(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            // Take the sgUSD manager
            let mut manager = ts::take_shared<SGUSD_Manager>(scenario);
            
            // Mint sgUSD tokens to USER
            sg_usd::mint(
                &mut manager,
                MINT_AMOUNT,
                USER,
                ts::ctx(scenario)
            );
            
            // Return objects
            ts::return_shared(manager);
        };
        
        // Verify USER received the tokens
        ts::next_tx(scenario, USER);
        {
            // Get the sgUSD coins owned by USER
            let coins = ts::ids_for_address<coin::Coin<SG_USD>>(USER);
            
            // Verify USER has exactly one sgUSD coin
            assert_eq(vector::length(&coins), 1);
            
            // Take the coin to verify its value
            let coin = ts::take_from_address<coin::Coin<SG_USD>>(scenario, USER);
            
            // Verify the coin has the correct amount
            assert_eq(coin::value(&coin), MINT_AMOUNT);
            
            // Return the coin to USER
            ts::return_to_address(USER, coin);
        };
    }
    
    fun burn_sg_usd(scenario: &mut Scenario) {
        ts::next_tx(scenario, USER);
        {
            // Take the sgUSD manager
            let mut manager = ts::take_shared<SGUSD_Manager>(scenario);
            
            // Take the coin from USER
            let coin = ts::take_from_address<coin::Coin<SG_USD>>(scenario, USER);
            
            // Get the total supply before burning
            let supply_before = sg_usd::total_supply(&manager);
            
            // Burn the sgUSD tokens
            sg_usd::burn(
                &mut manager,
                coin
            );
            
            // Get the total supply after burning
            let supply_after = sg_usd::total_supply(&manager);
            
            // Verify the supply decreased by the correct amount
            assert_eq(supply_before - supply_after, MINT_AMOUNT);
            
            // Return objects
            ts::return_shared(manager);
        };
    }
}

