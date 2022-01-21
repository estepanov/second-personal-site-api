export class ResponseBodyVO {
  code: number;

  message: string;

  data?: never;
}

export class ResponseVO {
  statusCode: number;

  body: string;
}
