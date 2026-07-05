/**
 * Command used by the IAM application layer to register a new user.
 *
 * @class SignUpCommand
 */
export class SignUpCommand {
    /**
     * @param {Object} params - Command attributes.
     * @param {string} params.email - User email.
     * @param {string} params.password - Desired password.
     * @param {string} params.plan - Chosen subscription plan.
     */
    constructor({ email, password, plan }) {
        this.email = email;
        this.password = password;
        this.plan = plan;
    }
}
