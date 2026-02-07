import { HttpException, HttpStatus } from "@nestjs/common";
import { Resend } from "resend";
import { SendEmailDto } from "./dto/send-email.dto";

const resend = new Resend(process.env.RESEND_API);

export async function sendEmail(email: string) {
	try {
		const { data, error } = await resend.emails.send({
			from: "Acme <onboarding@resend.dev>",
			to: [email],
			subject: "Hello World",
			html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
		});

		console.log(data, error);

		return { message: "Email enviado com sucesso" };
	} catch (_error) {
		throw new HttpException("Credenciais invalidas.", HttpStatus.CONFLICT);
	}
}
