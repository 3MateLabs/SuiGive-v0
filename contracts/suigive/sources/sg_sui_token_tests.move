#[test_only]
module suigive::sg_sui_token_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use suigive::sg_sui_token::{Self, SgSuiTreasury, SgSuiMinterCap, SG_SUI_TOKEN};
    
    // Test addresses
    const ADMIN: address = @0xAD;
    const USER1: address = @0xB1;
    const USER2: address = @0xB2;
    const CAMPAIGN1: address = @0xC1;
    const CAMPAIGN2: address = @0xC2;
    
    // Test constants
    const MINT_AMOUNT: u64 = 1_000_000_000; // 1 SUI
    const REDEEM_AMOUNT: u64 = 500_000_000; // 0.5 SUI
    const TRANSFER_AMOUNT: u64 = 200_000_000; // 0.2 SUI
    
    #[test]
    fun test_redeem_sg_sui_basic() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        init_sg_sui_token(&mut scenario);
        
        // Mint sgSUI tokens
        mint_sg_sui_for_user(&mut scenario, USER1, MINT_AMOUNT);
        
        // Redeem sgSUI tokens
        ts::next_tx(&mut scenario, USER1);
        {
            let mut treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            let sg_sui_coin = ts::take_from_sender<Coin<SG_SUI_TOKEN>>(&scenario);
            
            // Redeem using the basic function
            sg_sui_token::redeem_sg_sui(
                &mut treasury,
                sg_sui_coin,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(treasury);
        };
        
        // Verify USER1 received SUI
        ts::next_tx(&mut scenario, USER1);
        {
            let sui_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert_eq(coin::value(&sui_coin), MINT_AMOUNT);
            ts::return_to_sender(&scenario, sui_coin);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_redeem_sg_sui_with_campaign() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        init_sg_sui_token(&mut scenario);
        
        // Add funds to treasury for a campaign
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            let mut minter_cap = ts::take_from_sender<SgSuiMinterCap>(&scenario);
            let sui_coin = coin::mint_for_testing<SUI>(MINT_AMOUNT, ts::ctx(&mut scenario));
            
            sg_sui_token::add_funds_and_mint(
                &mut treasury,
                &mut minter_cap,
                sui_coin,
                USER1,
                CAMPAIGN1,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, minter_cap);
            ts::return_shared(treasury);
        };
        
        // Redeem with campaign tracking
        ts::next_tx(&mut scenario, USER1);
        {
            let mut treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            let sg_sui_coin = ts::take_from_sender<Coin<SG_SUI_TOKEN>>(&scenario);
            
            sg_sui_token::redeem_sg_sui_with_campaign(
                &mut treasury,
                sg_sui_coin,
                CAMPAIGN1,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(treasury);
        };
        
        // Verify campaign balance was reduced
        ts::next_tx(&mut scenario, ADMIN);
        {
            let treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            let campaign_balance = sg_sui_token::get_campaign_balance(&treasury, CAMPAIGN1);
            assert_eq(campaign_balance, 0);
            ts::return_shared(treasury);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_transfer_sg_sui() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        init_sg_sui_token(&mut scenario);
        
        // Mint sgSUI tokens to USER1
        mint_sg_sui_for_user(&mut scenario, USER1, MINT_AMOUNT);
        
        // Transfer from USER1 to USER2
        ts::next_tx(&mut scenario, USER1);
        {
            let mut sg_sui_coin = ts::take_from_sender<Coin<SG_SUI_TOKEN>>(&scenario);
            let transfer_coin = coin::split(&mut sg_sui_coin, TRANSFER_AMOUNT, ts::ctx(&mut scenario));
            
            sg_sui_token::transfer_sg_sui(
                transfer_coin,
                USER2,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, sg_sui_coin);
        };
        
        // Verify USER2 received tokens
        ts::next_tx(&mut scenario, USER2);
        {
            let sg_sui_coin = ts::take_from_sender<Coin<SG_SUI_TOKEN>>(&scenario);
            assert_eq(coin::value(&sg_sui_coin), TRANSFER_AMOUNT);
            ts::return_to_sender(&scenario, sg_sui_coin);
        };
        
        // Verify USER1 has remaining balance
        ts::next_tx(&mut scenario, USER1);
        {
            let sg_sui_coin = ts::take_from_sender<Coin<SG_SUI_TOKEN>>(&scenario);
            assert_eq(coin::value(&sg_sui_coin), MINT_AMOUNT - TRANSFER_AMOUNT);
            ts::return_to_sender(&scenario, sg_sui_coin);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_treasury_view_functions() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        init_sg_sui_token(&mut scenario);
        
        // Add funds for multiple campaigns
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            let mut minter_cap = ts::take_from_sender<SgSuiMinterCap>(&scenario);
            
            // Add funds for CAMPAIGN1
            let sui_coin1 = coin::mint_for_testing<SUI>(MINT_AMOUNT, ts::ctx(&mut scenario));
            sg_sui_token::add_funds_and_mint(
                &mut treasury,
                &mut minter_cap,
                sui_coin1,
                USER1,
                CAMPAIGN1,
                ts::ctx(&mut scenario)
            );
            
            // Add funds for CAMPAIGN2
            let sui_coin2 = coin::mint_for_testing<SUI>(MINT_AMOUNT * 2, ts::ctx(&mut scenario));
            sg_sui_token::add_funds_and_mint(
                &mut treasury,
                &mut minter_cap,
                sui_coin2,
                USER2,
                CAMPAIGN2,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, minter_cap);
            ts::return_shared(treasury);
        };
        
        // Test view functions
        ts::next_tx(&mut scenario, ADMIN);
        {
            let treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            
            // Test treasury_balance
            let total_balance = sg_sui_token::treasury_balance(&treasury);
            assert_eq(total_balance, MINT_AMOUNT * 3);
            
            // Test get_campaign_balance
            let campaign1_balance = sg_sui_token::get_campaign_balance(&treasury, CAMPAIGN1);
            assert_eq(campaign1_balance, MINT_AMOUNT);
            
            let campaign2_balance = sg_sui_token::get_campaign_balance(&treasury, CAMPAIGN2);
            assert_eq(campaign2_balance, MINT_AMOUNT * 2);
            
            // Test get_treasury_stats
            let (balance, total_minted, total_redeemed) = sg_sui_token::get_treasury_stats(&treasury);
            assert_eq(balance, MINT_AMOUNT * 3);
            assert_eq(total_minted, MINT_AMOUNT * 3);
            assert_eq(total_redeemed, 0);
            
            ts::return_shared(treasury);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_partial_redemption() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize
        init_sg_sui_token(&mut scenario);
        
        // Mint sgSUI tokens
        mint_sg_sui_for_user(&mut scenario, USER1, MINT_AMOUNT);
        
        // Redeem partial amount
        ts::next_tx(&mut scenario, USER1);
        {
            let mut treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            let mut sg_sui_coin = ts::take_from_sender<Coin<SG_SUI_TOKEN>>(&scenario);
            let redeem_coin = coin::split(&mut sg_sui_coin, REDEEM_AMOUNT, ts::ctx(&mut scenario));
            
            sg_sui_token::redeem_sg_sui(
                &mut treasury,
                redeem_coin,
                ts::ctx(&mut scenario)
            );
            
            // Return remaining sgSUI
            ts::return_to_sender(&scenario, sg_sui_coin);
            ts::return_shared(treasury);
        };
        
        // Verify balances
        ts::next_tx(&mut scenario, USER1);
        {
            // Check SUI received
            let sui_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert_eq(coin::value(&sui_coin), REDEEM_AMOUNT);
            ts::return_to_sender(&scenario, sui_coin);
            
            // Check remaining sgSUI
            let sg_sui_coin = ts::take_from_sender<Coin<SG_SUI_TOKEN>>(&scenario);
            assert_eq(coin::value(&sg_sui_coin), MINT_AMOUNT - REDEEM_AMOUNT);
            ts::return_to_sender(&scenario, sg_sui_coin);
        };
        
        // Check treasury stats
        ts::next_tx(&mut scenario, ADMIN);
        {
            let treasury = ts::take_shared<SgSuiTreasury>(&scenario);
            let (balance, total_minted, total_redeemed) = sg_sui_token::get_treasury_stats(&treasury);
            assert_eq(balance, MINT_AMOUNT - REDEEM_AMOUNT);
            assert_eq(total_minted, MINT_AMOUNT);
            assert_eq(total_redeemed, REDEEM_AMOUNT);
            ts::return_shared(treasury);
        };
        
        ts::end(scenario);
    }
    
    // Helper functions
    fun init_sg_sui_token(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            sg_sui_token::init_for_testing(ts::ctx(scenario));
        };
    }
    
    fun mint_sg_sui_for_user(scenario: &mut Scenario, user: address, amount: u64) {
        ts::next_tx(scenario, ADMIN);
        {
            let mut treasury = ts::take_shared<SgSuiTreasury>(scenario);
            let mut minter_cap = ts::take_from_sender<SgSuiMinterCap>(scenario);
            let sui_coin = coin::mint_for_testing<SUI>(amount, ts::ctx(scenario));
            
            sg_sui_token::add_funds_and_mint(
                &mut treasury,
                &mut minter_cap,
                sui_coin,
                user,
                @0x0, // No specific campaign
                ts::ctx(scenario)
            );
            
            ts::return_to_sender(scenario, minter_cap);
            ts::return_shared(treasury);
        };
    }
}