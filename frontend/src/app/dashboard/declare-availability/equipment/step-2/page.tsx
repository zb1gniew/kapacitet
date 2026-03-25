import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

export default function DeclareAvailabilityEquipmentStep2Page() {
  redirect(APP_ROUTES.declareAvailabilityWorkersStep2);
}
