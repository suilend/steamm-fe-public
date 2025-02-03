module steamm::setup;

use steamm::b_sui::B_SUI;
use steamm::b_usdc::B_USDC;
use steamm::bank;
use steamm::cpmm;
use steamm::lp_usdc_sui::LP_USDC_SUI;
use steamm::registry::Registry;
use steamm::sui::SUI;
use steamm::usdc::USDC;
use sui::coin::{CoinMetadata, TreasuryCap};
use suilend::lending_market_registry::{Self as lending, Registry as LendingRegistry};

public struct LENDING_MARKET has drop {}

// TODO: You are here!!
// 1. swrite move module - has lending market type, function to setup lending market, banks, amm pool, setups test currencies, deploys liquidity to pool

#[allow(lint(self_transfer, share_owned))]
public fun setup(
    lending_registry: &mut LendingRegistry,
    // Steamm Pool
    registry: &mut Registry,
    meta_lp_usdc_sui: &mut CoinMetadata<LP_USDC_SUI>,
    lp_treasury: TreasuryCap<LP_USDC_SUI>,
    // Steamm Bank
    meta_usdc: &CoinMetadata<USDC>,
    meta_sui: &CoinMetadata<SUI>,
    meta_b_usdc: &mut CoinMetadata<B_USDC>,
    meta_b_sui: &mut CoinMetadata<B_SUI>,
    b_usdc_treasury: TreasuryCap<B_USDC>,
    b_sui_treasury: TreasuryCap<B_SUI>,
    ctx: &mut TxContext,
) {
    let (lending_cap, lending_market) = lending::create_lending_market<LENDING_MARKET>(
        lending_registry,
        ctx,
    );

    let (pool, pool_cap) = cpmm::new<B_USDC, B_SUI, LP_USDC_SUI>(
        registry,
        100,
        0,
        meta_b_usdc,
        meta_b_sui,
        meta_lp_usdc_sui,
        lp_treasury,
        ctx,
    );

    bank::create_bank_and_share<LENDING_MARKET, USDC, B_USDC>(
        registry,
        meta_usdc,
        meta_b_usdc,
        b_usdc_treasury,
        &lending_market,
        ctx,
    );

    bank::create_bank_and_share<LENDING_MARKET, SUI, B_SUI>(
        registry,
        meta_sui,
        meta_b_sui,
        b_sui_treasury,
        &lending_market,
        ctx,
    );

    sui::transfer::public_share_object(lending_market);
    sui::transfer::public_share_object(pool);
    sui::transfer::public_transfer(lending_cap, ctx.sender());
    sui::transfer::public_transfer(pool_cap, ctx.sender());
}
