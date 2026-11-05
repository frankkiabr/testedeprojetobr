import { Outlet } from "react-router-dom";
import { useStore } from "@/data/store";

/** Negócios: cada item (Leads, Imóveis, Proprietários...) é uma página própria, aberta pelo grupo "Negócios" do menu lateral. */
export default function NegociosLayout() {
  useStore();
  return <Outlet />;
}
