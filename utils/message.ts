import { ResponseVO } from "@models/vo/ResponseVo";
import { Result, StatusCode } from "./result";

export class MessageUtil {
  static success<T>(data: T): ResponseVO {
    const result = new Result(StatusCode.success, 0, "success", data);
    return result.bodyToString();
  }

  static error(status: StatusCode, message: string, code = 1000): ResponseVO {
    const result = new Result(status, code, message);
    // eslint-disable-next-line no-console
    console.error("ERROR LOG:", result.bodyToString());
    return result.bodyToString();
  }
}
