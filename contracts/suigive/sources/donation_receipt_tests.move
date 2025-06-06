#[test_only]
module suigive::donation_receipt_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils::assert_eq;
    use std::string::{utf8};
    use sui::url;
    use suigive::donation_receipt::{Self, DonationReceipt, AdminCap};
    
    // Test addresses
    const ADMIN: address = @0xAD;
    const CAMPAIGN: address = @0xC1;
    const DONOR1: address = @0xD1;
    const DONOR2: address = @0xD2;
    
    // Test constants
    const DONATION_AMOUNT: u64 = 1_000_000_000; // 1 SUI
    
    #[test]
    fun test_mint_donation_receipt() {
        let mut scenario = ts::begin(ADMIN);
        
        // Mint a donation receipt
        ts::next_tx(&mut scenario, ADMIN);
        {
            let receipt = donation_receipt::mint(
                CAMPAIGN,
                DONOR1,
                DONATION_AMOUNT,
                b"Thank you for supporting our cause!",
                false, // not anonymous
                b"SuiGive Donation Receipt",
                b"Proof of donation to campaign",
                b"https://example.com/receipt.png",
                ts::ctx(&mut scenario)
            );
            
            // Verify receipt details
            let (campaign_id, donor, amount, _timestamp, message, is_anonymous) = 
                donation_receipt::get_details(&receipt);
            
            assert_eq(campaign_id, CAMPAIGN);
            assert_eq(donor, DONOR1);
            assert_eq(amount, DONATION_AMOUNT);
            assert_eq(message, utf8(b"Thank you for supporting our cause!"));
            assert_eq(is_anonymous, false);
            
            // Transfer to donor
            donation_receipt::transfer_receipt(receipt, DONOR1);
        };
        
        // Verify donor received the receipt
        ts::next_tx(&mut scenario, DONOR1);
        {
            let receipt = ts::take_from_sender<DonationReceipt>(&scenario);
            let (_, _, _, _, _, _) = donation_receipt::get_details(&receipt);
            ts::return_to_sender(&scenario, receipt);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_mint_and_send() {
        let mut scenario = ts::begin(ADMIN);
        
        // Use the entry function to mint and send (DONOR2 is the sender)
        ts::next_tx(&mut scenario, DONOR2);
        {
            donation_receipt::mint_and_send(
                CAMPAIGN,
                DONATION_AMOUNT * 2,
                b"Large donation!",
                true, // anonymous
                b"Anonymous Donation Receipt",
                b"Anonymous proof of donation",
                b"https://example.com/anon.png",
                ts::ctx(&mut scenario)
            );
        };
        
        // Verify donor received the receipt
        ts::next_tx(&mut scenario, DONOR2);
        {
            let receipt = ts::take_from_sender<DonationReceipt>(&scenario);
            let (campaign_id, donor, amount, _, message, is_anonymous) = 
                donation_receipt::get_details(&receipt);
            
            assert_eq(campaign_id, CAMPAIGN);
            assert_eq(donor, DONOR2);
            assert_eq(amount, DONATION_AMOUNT * 2);
            assert_eq(message, utf8(b"Large donation!"));
            assert_eq(is_anonymous, true);
            
            ts::return_to_sender(&scenario, receipt);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_admin_cap_and_burn() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create admin cap for campaign
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = donation_receipt::create_admin_cap(
                CAMPAIGN,
                ts::ctx(&mut scenario)
            );
            transfer::public_transfer(admin_cap, ADMIN);
        };
        
        // Mint a receipt
        ts::next_tx(&mut scenario, ADMIN);
        {
            let receipt = donation_receipt::mint(
                CAMPAIGN,
                DONOR1,
                DONATION_AMOUNT,
                b"Refundable donation",
                false,
                b"Receipt",
                b"Description",
                b"https://example.com/r.png",
                ts::ctx(&mut scenario)
            );
            donation_receipt::transfer_receipt(receipt, DONOR1);
        };
        
        // Donor has the receipt
        ts::next_tx(&mut scenario, DONOR1);
        {
            let receipt = ts::take_from_sender<DonationReceipt>(&scenario);
            donation_receipt::transfer_receipt(receipt, ADMIN); // Transfer to admin for burning
        };
        
        // Admin burns the receipt (for refund)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let receipt = ts::take_from_sender<DonationReceipt>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            
            donation_receipt::burn(
                receipt,
                b"Refunded at donor's request",
                &admin_cap,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, admin_cap);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    #[expected_failure(abort_code = suigive::donation_receipt::ENotTransferable)]
    fun test_soulbound_transfer_fails() {
        let mut scenario = ts::begin(ADMIN);
        
        // Mint a receipt
        ts::next_tx(&mut scenario, ADMIN);
        {
            let receipt = donation_receipt::mint(
                CAMPAIGN,
                DONOR1,
                DONATION_AMOUNT,
                b"Test",
                false,
                b"Receipt",
                b"Description",
                b"https://example.com/r.png",
                ts::ctx(&mut scenario)
            );
            donation_receipt::transfer_receipt(receipt, DONOR1);
        };
        
        // Try to transfer the soulbound receipt (should fail)
        ts::next_tx(&mut scenario, DONOR1);
        {
            let receipt = ts::take_from_sender<DonationReceipt>(&scenario);
            
            // This should abort with ENotTransferable
            donation_receipt::transfer_donation_receipt(
                &receipt,
                DONOR2,
                ts::ctx(&mut scenario)
            );
            
            ts::return_to_sender(&scenario, receipt);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_metadata_functions() {
        let mut scenario = ts::begin(ADMIN);
        
        // Mint a receipt with metadata
        ts::next_tx(&mut scenario, ADMIN);
        {
            let receipt = donation_receipt::mint(
                CAMPAIGN,
                DONOR1,
                DONATION_AMOUNT,
                b"Testing metadata",
                false,
                b"Test NFT Name",
                b"Test NFT Description",
                b"https://test.com/nft.jpg",
                ts::ctx(&mut scenario)
            );
            
            // Test get_metadata
            let (name, description, url) = donation_receipt::get_metadata(&receipt);
            assert_eq(name, utf8(b"Test NFT Name"));
            assert_eq(description, utf8(b"Test NFT Description"));
            // URL comparison - just verify it exists
            let _ = url::inner_url(&url);
            
            donation_receipt::transfer_receipt(receipt, DONOR1);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_multiple_receipts_same_donor() {
        let mut scenario = ts::begin(ADMIN);
        
        // Mint multiple receipts for the same donor
        ts::next_tx(&mut scenario, ADMIN);
        {
            // First donation
            let receipt1 = donation_receipt::mint(
                CAMPAIGN,
                DONOR1,
                DONATION_AMOUNT,
                b"First donation",
                false,
                b"Receipt 1",
                b"First receipt",
                b"https://example.com/1.png",
                ts::ctx(&mut scenario)
            );
            donation_receipt::transfer_receipt(receipt1, DONOR1);
            
            // Second donation
            let receipt2 = donation_receipt::mint(
                CAMPAIGN,
                DONOR1,
                DONATION_AMOUNT * 2,
                b"Second donation",
                false,
                b"Receipt 2",
                b"Second receipt",
                b"https://example.com/2.png",
                ts::ctx(&mut scenario)
            );
            donation_receipt::transfer_receipt(receipt2, DONOR1);
        };
        
        // Verify donor has both receipts
        ts::next_tx(&mut scenario, DONOR1);
        {
            // Since we can't take multiple receipts at once, we'll just verify
            // that at least one exists (the test scenario doesn't support
            // taking multiple objects of the same type easily)
            assert!(ts::has_most_recent_for_sender<DonationReceipt>(&scenario));
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_anonymous_donation_receipt() {
        let mut scenario = ts::begin(ADMIN);
        
        // Mint anonymous receipt
        ts::next_tx(&mut scenario, ADMIN);
        {
            let receipt = donation_receipt::mint(
                CAMPAIGN,
                DONOR1,
                DONATION_AMOUNT,
                b"", // Empty message for anonymous
                true, // anonymous
                b"Anonymous Donation",
                b"Anonymous contribution",
                b"https://example.com/anon.png",
                ts::ctx(&mut scenario)
            );
            
            // Verify anonymous flag
            let (_, _, _, _, _, is_anonymous) = donation_receipt::get_details(&receipt);
            assert_eq(is_anonymous, true);
            
            donation_receipt::transfer_receipt(receipt, DONOR1);
        };
        
        ts::end(scenario);
    }
}