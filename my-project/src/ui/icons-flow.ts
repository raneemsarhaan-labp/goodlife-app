import { FLOW_ICONS } from "./icons-flow.generated";

/** Icons only «خطتي» and the habit flow use (kept out of the shared icon module «يومك» loads). */
export type FlowIconName = keyof typeof FLOW_ICONS;
export const flowIcon = (name: FlowIconName): string => FLOW_ICONS[name];
