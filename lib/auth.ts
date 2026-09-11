import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET ||
        "change-this-development-secret"
);

export type SessionUser = {
    id: number;
    name: string;
    email: string;
    role: "CUSTOMER" | "ADMIN";
};

export async function createSession(
    user: SessionUser
) {
    const token = await new SignJWT(user)
        .setProtectedHeader({
            alg: "HS256"
        })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    const jar = await cookies();

    jar.set("aurora_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/"
    });
}

export async function getSession(): Promise<SessionUser | null> {
    const token = (await cookies()).get(
        "aurora_session"
    )?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(
            token,
            secret
        );

        return payload as unknown as SessionUser;
    } catch {
        return null;
    }
}

export async function clearSession() {
    (await cookies()).delete("aurora_session");
}