/**
 * Command used by the IAM application layer to request authentication.
 *
 * @class SignInCommand
 */
export class SignInCommand {
    constructor({ email, password }) {
        this.email = email;
        this.password = password;
    }
}
