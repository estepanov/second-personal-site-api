import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";
import { MessageUtil } from "@utils/message";
import { StatusCode } from "@utils/result";
import { HaloStatsTracker } from "@utils/HaloStatsTracker";

export const overview: APIGatewayProxyHandler = async () => {
  try {
    const haloStatsTracker = new HaloStatsTracker();
    const stats = await haloStatsTracker.fetchLookUpStats();
    return MessageUtil.success(stats);
  } catch (err) {
    return MessageUtil.error(StatusCode.internalServerError, err.message);
  }
};
