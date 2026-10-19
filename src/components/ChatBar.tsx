import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import { site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { LogoMark } from "./ui";

/** Barra flutuante de mensagem: aparece depois do hero e some quando o rodapé entra na tela. Abre o e-mail. */
export function ChatBar() {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const footer = document.getElementById("contato");
    let footerIn = false;
    const io = new IntersectionObserver(([e]) => {
      footerIn = e.isIntersecting;
      update();
    });
    const update = () => setVisible(window.scrollY > 420 && !footerIn);
    if (footer) io.observe(footer);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent("Contato pelo site da Frankkia");
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${encodeURIComponent(msg)}`;
    setMsg("");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.form
          onSubmit={send}
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 100, opacity: 0, x: "-50%" }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="fixed bottom-5 left-1/2 z-40 flex w-[min(30rem,calc(100vw-2rem))] items-center gap-2 rounded-full border border-line bg-bg/95 p-1.5 shadow-float backdrop-blur-md"
        >
          <LogoMark className="size-8 text-sm" />
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Envie uma mensagem..."
            className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-subtle"
          />
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-semibold text-bg transition-transform active:scale-[0.97]"
          >
            <Send className="size-3.5" />
            Enviar
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
