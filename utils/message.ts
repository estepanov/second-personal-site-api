import { ResponseVO } from '@models/vo/responseVo';
import { Result, StatusCode } from './result';

export class MessageUtil {
  static success(data: object): ResponseVO {
    const result = new Result(StatusCode.success, 0, 'success', data);
    return result.bodyToString();
  }

  static error(status: StatusCode, message: string, code: number = 1000) {
    const result = new Result(status, code, message);
    console.log("ERROR LOG:",result.bodyToString());
    return result.bodyToString();
  }
}