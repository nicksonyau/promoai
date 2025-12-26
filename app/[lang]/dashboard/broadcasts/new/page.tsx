import { BroadcastProvider } from "./BroadcastContext";
import BroadcastFlow from "./BroadcastFlow";

export default function Page() {
  return (
    <BroadcastProvider>
      <BroadcastFlow />
    </BroadcastProvider>
  );
}
