import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

export default function DeclareAvailabilityEquipmentPage() {
  redirect(APP_ROUTES.declareAvailabilityWorkersStep1);
}
