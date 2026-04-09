import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "default" | "white";
  width?: number;
  height?: number;
}

export const Logo = ({ variant = "default", width = 120, height = 30 }: LogoProps) => {
  const logoSrc = variant === "white" ? "/logo-white.svg" : "/logo.svg";

  return (
    <Link href="/" className="flex items-center">
      <Image
        src={logoSrc}
        alt="Get Easy logo"
        width={width}
        height={height}
        className="object-cover"
      />
    </Link>
  );
};
