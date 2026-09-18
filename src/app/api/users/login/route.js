import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // 1. Validasi: Wajib isi email dan password
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email dan password wajib diisi!" },
                { status: 400 } // Bad Request
            );
        }

        // 2. Query ke DB jika input valid
        const user = await db.users.findFirst({
            where: {
                email: email,
                password: password,
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Email atau password salah!" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                message: "Login berhasil",
                user_id: user.user_id,
                email: user.email,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Terjadi kesalahan server", error: error.message },
            { status: 500 }
        );
    }
}