import { useEffect, useState } from "react";
import { startLenis } from "@/lib/scroll";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Ecosystem } from "@/components/Ecosystem";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { Clientes } from "@/components/Clientes";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { ChatBar } from "@/components/ChatBar";
import { CommandPalette } from "@/components/CommandPalette";

/** Site público (página de apresentação da Frankkia). */
export default function Landing() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => startLenis(), []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ecosystem />
        <Features />
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
