import { AzureFunction, Context } from "@azure/functions";

const timerTrigger: AzureFunction = (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer: any
) => {
  context.log(`Timer: ${JSON.stringify(timer)}`);
};

export default timerTrigger;
