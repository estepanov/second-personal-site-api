import { APIGatewayProxyHandler, APIGatewayEvent } from "aws-lambda";
import "source-map-support/register";
import { echo } from "@queries/exampleQuery";

export const hello: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  // context: Context,
  // callback: Callback,
) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: echo("Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!"),
        input: event,
        // context: context,
        // callback: callback,
      },
      null,
      2,
    ),
  };
};
