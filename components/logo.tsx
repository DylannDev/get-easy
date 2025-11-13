import Image from "next/image";
import Link from "next/link";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src="/logo.svg"
        alt="Get Easy logo"
        width={120}
        height={30}
        className="object-cover"
      />
    </Link>
  );
};
