import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SUPABASE_URL } from "@/integrations/frankkia/client";
import { Logo } from "@/components/ui";

/**
 * VOLTA DO GOOGLE (/google-agenda/retorno).
 * O Google devolve a pessoa para frankkia.com (domínio verificado da Frankkia); esta página só repassa
 * o código para a função google-agenda, que guarda a conexão e volta para a Agenda.
 */
export default function GoogleRetorno() {
  useEffect(() => {
    window.location.replace(`${SUPABASE_URL}/functions/v1/google-agenda${window.location.search}`);
  }, []);
  return (
    <div className="grid min-h-screen place-items-center bg-canvas/60 px-4">
      <div className="text-center">
        <Logo className="text-[1.75rem]" />
        <p className="mt-6 flex items-center justify-center gap-2 text-muted">
          <Loader2 className="size-4 animate-spin" /> Conectando ao Google Agenda...
        </p>
      </div>
    </div>
  );
}
