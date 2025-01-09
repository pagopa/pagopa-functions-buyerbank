import { AzureFunction, Context } from "@azure/functions";
// import { updateBuyerBank } from "./handler";

const timerTrigger: AzureFunction = (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  timer: any
) => {
  // eslint-disable-next-line extra-rules/no-commented-out-code
  // updateBuyerBank(context, timer);
  context.log("Function is disabled.");
};

export default timerTrigger;
