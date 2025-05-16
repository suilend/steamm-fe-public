import { ASSETS_URL } from "@/lib/constants";

export default function PointsHeader() {
  return (
    <div className="-mt-6 w-full md:-mt-8">
      <div className="-mx-4 flex h-[160px] flex-row justify-center md:-mx-10 md:h-[200px]">
        <div className="relative w-full max-w-[calc(1440px-40px*2)] border-b border-b-border/50">
          <div
            className="absolute inset-0 z-[1]"
            style={{
              backgroundImage: `url('${ASSETS_URL}/points/header.png')`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
            }}
          />

          <div className="relative z-[2] flex h-full w-full flex-col items-center justify-center">
            <h1 className="text-center text-h1 font-medium text-foreground md:text-[48px]">
              STEAMM Points
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
