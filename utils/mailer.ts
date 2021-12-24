import aws from 'aws-sdk'
const ses = new aws.SES()

interface MessageDetail {
    text?: string;
    html?: string;
}

interface AWSMessage {
    Body: {
        Text?: {
            Charset: string;
            Data: string;
        }
        Html?: {
            Charset: string;
            Data: string;
        }
    }
    Subject: {
        Charset: string;
        Data: string;
    }
}

interface Options {
    source: string;
    destination: string;
    replyTo: string;
    subject: string;
    message: MessageDetail
}

export class Mailer {
    sourceAddress: string;
    destinationAddress: string;
    replyToAddress: string;
    private Message: AWSMessage;
    
    constructor(
        {source,
        destination,
        replyTo,
        subject,
        message
    }: Options
    ) {
        this.sourceAddress = source
        this.destinationAddress = destination
        this.replyToAddress = replyTo
        this.Message = this.buildMessage(subject, message)
        return this
    }

    private buildMessage = (subject: string, body: MessageDetail) => {
        const result: AWSMessage = {
            Body: {},
            Subject: {
              Charset: 'UTF-8',
              Data: subject
            }
        };
    
        if(body.text) {
            result.Body.Text = {
                Charset: 'UTF-8',
                Data: body.text
              }
        }
    
        if(body.html) {
            result.Body.Html = {
                Charset: 'UTF-8',
                Data: body.html
              }
        }
    
        return result
      }

        private sendParams = () => {
          return ({
            Source: this.sourceAddress,
            Destination: { ToAddresses: [this.destinationAddress] },
            ReplyToAddresses: [this.replyToAddress],
            Message: this.Message
          })
      }

      send = async ()=> {
        const data = await ses.sendEmail(this.sendParams()).promise()
        if (data.$response.error) {
            console.log('[ERROR][SES]', data)
            throw new Error('email failed')
        }
        return data
      }

}