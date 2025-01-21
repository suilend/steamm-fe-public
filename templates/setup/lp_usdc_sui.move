module steamm::lp_usdc_sui;

const NAME: vector<u8> = b"Steamm LP Token bUSDC-bSUI";
const SYMBOL: vector<u8> = b"steammLP bUSDC-bSUI";
const DESCRIPTION: vector<u8> = b"Steamm LP Token";
const DECIMALS: u8 = 9;

public struct LP_USDC_SUI has drop {}

fun init(otw: LP_USDC_SUI, ctx: &mut TxContext) {
    let (treasury_cap, coin_metadata) = sui::coin::create_currency(
        otw,
        DECIMALS,
        SYMBOL,
        NAME,
        DESCRIPTION,
        option::none(),
        ctx,
    );

    sui::transfer::public_transfer(treasury_cap, ctx.sender());
    sui::transfer::public_transfer(coin_metadata, ctx.sender());
}
