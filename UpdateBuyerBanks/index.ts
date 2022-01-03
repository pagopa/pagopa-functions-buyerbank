import { AzureFunction, Context } from "@azure/functions";
import { updateBuyerBank } from "./handler";

const timerTrigger: AzureFunction = (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer: any
) => updateBuyerBank(context, timer);

export default timerTrigger;
