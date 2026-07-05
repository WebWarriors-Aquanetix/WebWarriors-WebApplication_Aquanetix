/**
 * Infrastructure resource returned by the authentication endpoint.
 * Backend returns { id, email, role, token }. We expose email as username too
 * so existing UI code that reads "username" keeps working.
 *
 * @class SignInResource
 */
export class SignInResource {
    constructor({ id, email, role, token }) {
        this.id = id;
        this.email = email;
        this.username = email; // alias for existing UI code
        this.role = role;
        this.token = token;
    }
}
