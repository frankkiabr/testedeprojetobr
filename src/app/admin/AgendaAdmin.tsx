import { motion } from "framer-motion";
import { frankkiaUser } from "@/data/platform";
import { useStore } from "@/data/store";
import { PageHeader, stagger } from "../kit";
import { Agenda } from "../agenda/Agenda";

/** Agenda da equipe Frankkia (demonstrações, onboardings, renovações). */
export default function AgendaAdmin() {
  useStore();
  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader title="Agenda" subtitle="Demonstrações, onboardings e contatos com as imobiliárias." />
      </motion.div>
      <motion.div {...stagger(1)}>
        <Agenda eu={frankkiaUser} semVinculos />
      </motion.div>
    </div>
  );
}
