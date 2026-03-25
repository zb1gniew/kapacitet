import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

export default function DeclareAvailabilityEquipmentStep4Page() {
  redirect(APP_ROUTES.declareAvailabilityWorkersStep4);
}
