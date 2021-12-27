import { AzureFunction, Context } from "@azure/functions";
import { getUpdateBuyerBank } from "./handler";

const timerTrigger: AzureFunction = (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer: any
) => getUpdateBuyerBank(context, timer);

export default timerTrigger;
