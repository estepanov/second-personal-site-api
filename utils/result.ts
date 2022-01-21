import { APIGatewayProxyResult } from "aws-lambda";

export enum StatusCode {
  success = 200,
  badRequest = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  notAcceptable = 406,
  internalServerError = 500,
}

export class Result<T = undefined> {
  private statusCode: number;

  private code: number;

  private message: string;

  private data?: T;

  constructor(statusCode: number, code: number, message: string, data?: T) {
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.data = data;
  }

  /**
   * Serverless: According to the API Gateway specs, the body content must be stringified
   */
  bodyToString(): APIGatewayProxyResult {
    return {
      statusCode: this.statusCode,
      headers: {
        "Access-Control-Allow-Origin": process.env.HTTP_CORS_ORIGIN,
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        code: this.code,
        message: this.message,
        data: this.data,
      }),
    };
  }
}
