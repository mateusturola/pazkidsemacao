import { Revelar } from "@/components/site/revelar";

// Cada página monta o próprio topo e rodapé: o site institucional e a campanha têm marcas diferentes.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Revelar />
    </>
  );
}
