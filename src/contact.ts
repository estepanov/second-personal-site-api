import { APIGatewayProxyHandler, APIGatewayEvent } from "aws-lambda";
import "source-map-support/register";
import { verify } from "hcaptcha";
import * as disposableEmails from "disposable-email-domains";
import { email } from "@hapi/address";
import { sendMessageDTO } from "@models/dto/sendMessageDTO";
import { MessageUtil } from "@utils/message";
import { StatusCode } from "@utils/result";
import { Mailer } from "@utils/mailer";

const buildMessage = (messageDTO: sendMessageDTO) => {
  return {
    subject: "New Website Message",
    text: `new message from: \n${messageDTO.name} \n${messageDTO.email} \n message:\n ${messageDTO.message}`,
    html: `
      <div>
        <div>
          <b>from:</b>
          <p>${messageDTO.name}</p>
          <p>${messageDTO.email}</p>
        </div>
        <div>
          <b>message:</b>
          <p>${messageDTO.message}</p>
        </div>
      </div>
    `,
  };
};

export const sendMessage: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const message: sendMessageDTO = JSON.parse(event.body);
    // eslint-disable-next-line no-console
    console.log("[incoming]", message);
    if (!message.name || message.name.length < 3) {
      return MessageUtil.error(StatusCode.notAcceptable, "Missing or invalid name.");
    }
    if (!email.isValid(message.email)) {
      return MessageUtil.error(StatusCode.notAcceptable, "Invalid email.");
    }
    const domain = message.email.split("@")[1];
    if (disposableEmails.includes(domain)) {
      return MessageUtil.error(StatusCode.notAcceptable, "Sorry that looks like a disposable email provider.");
    }

    if (!message.message || message.message.length < 20) {
      return MessageUtil.error(StatusCode.notAcceptable, "Message must be atleast 20 characters :).");
    }
    if (!message.captchaToken || message.captchaToken.length < 20) {
      return MessageUtil.error(StatusCode.notAcceptable, "Captcha token is required :).");
    }
    try {
      const data = await verify(process.env.HCAPTCHA_SECRET, message.captchaToken);
      if (!data.success) throw new Error(data["error-codes"][0]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Token validation error", error);
      return MessageUtil.error(StatusCode.notAcceptable, "Captcha token error.");
    }
    const payload = buildMessage(message);
    if (process.env.NODE_ENV === "production") {
      const mailer = new Mailer({
        source: process.env.CONTACT_EMAIL,
        destination: process.env.CONTACT_EMAIL,
        replyTo: message.email,
        subject: payload.subject,
        message: {
          text: payload.text,
          html: payload.html,
        },
      });
      await mailer.send();
    } else {
      // eslint-disable-next-line no-console
      console.log("[DEV MODE] Skip sending this email:", payload);
    }
    return MessageUtil.success({
      message: "sending!",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error sending message", error);
    return MessageUtil.error(StatusCode.internalServerError, error.message);
  }
};
