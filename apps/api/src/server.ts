import { app } from "./app";
import { config } from "./config";
import { startOrderAutomation } from "./jobs/order-automation";

app.listen(config.port, () => {
  console.log(`LME API listening on port ${config.port} in ${config.env} mode`);
});

startOrderAutomation(config.orderAutomationIntervalMs);

