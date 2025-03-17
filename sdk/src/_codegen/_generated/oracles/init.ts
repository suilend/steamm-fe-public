import * as oracleDecimal from "./oracle-decimal/structs";
import * as oracles from "./oracles/structs";
import * as version from "./version/structs";
import {StructClassLoader} from "../_framework/loader";

export function registerClasses(loader: StructClassLoader) { loader.register(version.Version);
loader.register(oracleDecimal.OracleDecimal);
loader.register(oracles.AdminCap);
loader.register(oracles.Oracle);
loader.register(oracles.OraclePriceUpdate);
loader.register(oracles.OracleRegistry);
loader.register(oracles.OracleRegistryConfig);
 }
