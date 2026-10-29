import { useEffect, useState } from "react";
import { scrollToId, startLenis } from "@/lib/scroll";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Ecosystem } from "@/components/Ecosystem";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { Clientes } from "@/components/Clientes";
import { Vitrine } from "@/components/Vitrine";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { ChatBar } from "@/components/ChatBar";
import { CommandPalette } from "@/components/CommandPalette";

/** Site público (página de apresentação da Frankkia). */
export default function Landing() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => startLenis(), []);
  // Veio de outra página com âncora (ex.: /#planos, pelo menu do portal): desce até a seção depois que a página montou
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const t = setTimeout(() => scrollToId(id), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ecosystem />
        <Features />
        <Vitrine />
        <Clientes />
        <Pricing />
        <Faq />
      </main>
      <Footer onSearch={() => setPaletteOpen(true)} />
      <ChatBar />
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </>
  );
}
