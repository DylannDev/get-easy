import Image from "next/image";

export const Logo = () => {
  return (
    <div className="flex items-center">
      <Image
        src="/logo.svg"
        alt="Get Easy logo"
        width={120}
        height={30}
        className="object-cover"
      />
    </div>
  );
};
