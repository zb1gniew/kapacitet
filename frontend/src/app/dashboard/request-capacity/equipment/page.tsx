import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

export default function RequestCapacityEquipmentPage() {
  redirect(APP_ROUTES.requestCapacityWorkersStep1);
}
