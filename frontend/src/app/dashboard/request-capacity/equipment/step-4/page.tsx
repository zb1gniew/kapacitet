import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

export default function RequestCapacityEquipmentStep4Page() {
  redirect(APP_ROUTES.requestCapacityWorkersStep4);
}
