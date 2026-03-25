import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

export default function DeclareAvailabilityEquipmentStep3Page() {
  redirect(APP_ROUTES.declareAvailabilityWorkersStep3);
}
