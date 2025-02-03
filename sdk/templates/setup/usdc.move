module steamm::usdc;

const SYMBOL: vector<u8> = b"USDC";
const DESCRIPTION: vector<u8> = b"Test USDC";
const DECIMALS: u8 = 9;

public struct USDC has drop {}

fun init(otw: USDC, ctx: &mut TxContext) {
    let (treasury_cap, coin_metadata) = sui::coin::create_currency(
        otw,
        DECIMALS,
        SYMBOL,
        SYMBOL,
        DESCRIPTION,
        option::none(),
        ctx,
    );

    sui::transfer::public_transfer(treasury_cap, ctx.sender());
    sui::transfer::public_transfer(coin_metadata, ctx.sender());
}
