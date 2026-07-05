/**
 * IAM user aggregate root representation used by the client domain model.
 *
 * @class User
 */
export class User {
    constructor({ id, email, username, role }) {
        this.id = id;
        this.email = email ?? username;
        this.username = email ?? username; // alias
        this.role = role;
    }
}
