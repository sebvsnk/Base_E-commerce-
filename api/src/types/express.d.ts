import { Role } from "../middleware/auth";

declare global {
    namespace Express {
        interface Request {
            user?: {
                run: string;
                role: Role;
            };
            guest?: {
                orderId: string;
                email: string;
            };
        }
    }
}
