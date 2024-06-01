export class ServiceResponse {
    constructor(status, body, message) {
        this.status = status;
        this.body = body;
        this.message = message;
    }
}