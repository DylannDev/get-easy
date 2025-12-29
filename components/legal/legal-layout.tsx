import { ReactNode } from "react";

interface LegalLayoutProps {
  children: ReactNode;
}

export const LegalLayout = ({ children }: LegalLayoutProps) => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose max-w-none">{children}</div>
    </div>
  );
};
