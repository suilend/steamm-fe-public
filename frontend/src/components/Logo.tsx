import SteammLogo from "@/components/SteammLogo";

export default function Logo() {
  return (
    <div className="flex flex-row items-center gap-2">
      <SteammLogo size={24} />
      <p className="text-p1 text-foreground">STEAMM</p>
    </div>
  );
}
