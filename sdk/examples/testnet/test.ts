// // Construct LP token symbol

// const coinSymbol = "A";
// const bTokenSymbol = `b${coinSymbol}`;

// const coinType = `B_${coinSymbol}`;
// const coinModule = coinType.toLowerCase().replace(/\s+/g, "_");

// console.log(coinType);
// console.log(coinModule);

const coinType = "0xf234d::usdc::USDC";

const moduleName = coinType.split("::")[1];
const structType = coinType.split("::")[2];
console.log(moduleName);
console.log(structType);

const bModuleName = `b_${moduleName}`;
const bstructType = `B_${structType}`;

console.log(bModuleName);
console.log(bstructType);
