import { AzureFunction, Context } from "@azure/functions";
import { updateBuyerBank } from "./handler";

const timerTrigger: AzureFunction = (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer: any
) => {
  // updateBuyerBank(context, timer);
  context.log("Function is disabled.");
};

export default timerTrigger;
