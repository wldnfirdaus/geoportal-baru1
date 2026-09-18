import { NextResponse } from "next/server";
import { requireAuth } from "../../../../../lib/auth/verifyBearerToken";
import { db } from "../../../../../lib/db";

export async function DELETE(request) {
    const { payload, error, status } = requireAuth(request, "super_admin");
    if (error) {
        return NextResponse.json({ message: error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
        return NextResponse.json({ message: "user_id wajib disertakan" }, { status: 400 });
    }

    try {
        const deletedUser = await db.users.delete({
            where: { user_id },
            select: { user_id: true, email: true },
        });
        return NextResponse.json({ message: "Berhasil menghapus user", data: deletedUser }, { status: 200 });
    } catch (err) {
        if (err.code === "P2025") {
            return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
        }
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}