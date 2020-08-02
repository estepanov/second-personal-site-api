import { ResponseVO } from '@models/vo/responseVo';

export enum StatusCode {
  success = 200,
  badRequest = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  notAcceptable = 406,
  internalServerError = 500
}

class Result {
  private statusCode: number;
  private code: number;
  private message: string;
  private data?: any;

  constructor(statusCode: number, code: number, message: string, data?: any) {
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.data = data;
  }

  /**
   * Serverless: According to the API Gateway specs, the body content must be stringified
   */
  bodyToString () {
    return {
      statusCode: this.statusCode,
      headers: {
        'Access-Control-Allow-Origin': process.env.HTTP_CORS_ORIGIN,
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        code: this.code,
        message: this.message,
        data: this.data,
      }),
    };
  }
}

export class MessageUtil {
  static success(data: object): ResponseVO {
    const result = new Result(StatusCode.success, 0, 'success', data);

    return result.bodyToString();
  }

  static error(status: StatusCode = StatusCode.success, message: string, code: number = 1000) {
    const result = new Result(status, code, message);

    console.log("ERROR LOG:",result.bodyToString());
    return result.bodyToString();
  }
}