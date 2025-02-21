import * as package_source_1 from "../_dependencies/source/0x1/init";
import * as package_source_2 from "../_dependencies/source/0x2/init";
import * as package_source_3 from "../_dependencies/source/0x3/init";
import * as package_source_5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a from "../_dependencies/source/0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a/init";
import * as package_source_8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e from "../_dependencies/source/0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e/init";
import * as package_source_b0575765166030556a6eafd3b1b970eba8183ff748860680245b9edd41c716e7 from "../_dependencies/source/0xb0575765166030556a6eafd3b1b970eba8183ff748860680245b9edd41c716e7/init";
import * as package_source_b87cea7e4220461e35dff856185814d6a37ef479ce895ffbe4efa1d1af5aacbc from "../_dependencies/source/0xb87cea7e4220461e35dff856185814d6a37ef479ce895ffbe4efa1d1af5aacbc/init";
import * as package_source_f95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf from "../_dependencies/source/0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf/init";
import * as package_source_4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261 from "../steamm/init";
import * as package_source_7e69a01e9d856fdbfa315a3b0835d828ce632d3dd2fdc3d80de256895fca9e0a from "../steamm_scripts/init";
import {StructClassLoader} from "./loader";

function registerClassesSource(loader: StructClassLoader) {
    package_source_1.registerClasses(loader);
    package_source_2.registerClasses(loader);
    package_source_3.registerClasses(loader);
    package_source_4fb1cf45dffd6230305f1d269dd1816678cc8e3ba0b747a813a556921219f261.registerClasses(loader);
    package_source_5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a.registerClasses(loader);
    package_source_7e69a01e9d856fdbfa315a3b0835d828ce632d3dd2fdc3d80de256895fca9e0a.registerClasses(loader);
    package_source_8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e.registerClasses(loader);
    package_source_b0575765166030556a6eafd3b1b970eba8183ff748860680245b9edd41c716e7.registerClasses(loader);
    package_source_b87cea7e4220461e35dff856185814d6a37ef479ce895ffbe4efa1d1af5aacbc.registerClasses(loader);
    package_source_f95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf.registerClasses(loader);
}

export function registerClasses(loader: StructClassLoader) {
    registerClassesSource(loader);
}
