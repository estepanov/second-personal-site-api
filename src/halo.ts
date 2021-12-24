import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { Experience, HaloStats } from '@utils/HaloStats';
import { MessageUtil } from '@utils/message';

export const statsOverview: APIGatewayProxyHandler = async (): Promise<any> => {
  const service = new HaloStats(process.env.GAMER_TAG);
  const stats = await service.fetchOverview(Experience.ALL);
  return MessageUtil.success(stats)
};

export const pvpOverview: APIGatewayProxyHandler = async (): Promise<any> => {
  const service = new HaloStats(process.env.GAMER_TAG);
  const stats = await service.fetchOverview(Experience.PVP);
  return MessageUtil.success(stats)
};
