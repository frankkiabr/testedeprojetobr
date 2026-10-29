import { motion } from "framer-motion";
import { corretoresAtivos } from "@/data/queries";
import { useStore } from "@/data/store";
import { useScope } from "../session";
import { PageHeader, stagger } from "../kit";
import { Agenda } from "../agenda/Agenda";

/** Agenda da imobiliária: o corretor vê a própria; o administrador vê a própria e a da equipe. */
export default function AgendaPage() {
  useStore();
  const { isAdmin, user, solo } = useScope();
  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Agenda"
          subtitle={isAdmin && !solo ? "Seus compromissos e os da equipe, num só lugar." : "Visitas, captações, reuniões e ligações. As visitas dos seus leads aparecem aqui sozinhas."}
        />
      </motion.div>
      <motion.div {...stagger(1)}>
        <Agenda eu={user} equipe={isAdmin ? corretoresAtivos() : undefined} />
      </motion.div>
    </div>
  );
}
